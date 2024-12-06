import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const App: React.FC = () => {
  const [joueurs, setJoueurs] = useState<{ [key: string]: { id: string; x: number; y: number; taille: number; score: number; nom: string } }>({});
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<any>(null);
  const [direction, setDirection] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const TailleMapX = 4000;
  const TailleMapY = 4000;

  useEffect(() => {
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connexion");
    });

    socket.on("majJoueurs", (listeJoueurs) => {
      setJoueurs(listeJoueurs);
    });

    socket.on("majPoints", (listePoints) => {
      setPoints(listePoints);});

    socket.on("disconnect", () => {console.log("Déconnec");});

    setPoints(Array.from({ length: 1000 }, () => ({ x: Math.random()*TailleMapX, y: Math.random()*TailleMapY })));

    return () => {
      socket.disconnect();
    
    };}, []);

  const dessiner = () => { 
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
      const joueur = joueurs[socketRef.current.id];
      if (!joueur) return;

     
      const zoom = Math.max(0.5, Math.min(2, 100 / joueur.taille));

        
        
      const cameraX = Math.max(0, Math.min(joueur.x-canvas.width/2/zoom, TailleMapX-canvas.width/zoom));
      const cameraY = Math.max(0, Math.min(joueur.y-canvas.height/2/zoom, TailleMapY-canvas.height/zoom));
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; /*couleur fond quadrillé du jeu*/
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(zoom, 0, 0, zoom, -cameraX*zoom, -cameraY*zoom);
        const grilleSize = 50;
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= TailleMapX; x += grilleSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, TailleMapY);
          ctx.stroke();
        }
        for (let y = 0; y <= TailleMapY; y += grilleSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(TailleMapX, y);
          ctx.stroke();
      }
        points.forEach((point) => {
          ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "black";/*couleur points*/
        ctx.fill();
        });

        Object.values(joueurs).forEach((autreJoueur) => {ctx.beginPath();
        ctx.arc(autreJoueur.x, autreJoueur.y, autreJoueur.taille, 0, 2*Math.PI);
        ctx.fillStyle = autreJoueur.id === socketRef.current.id ? "blue" : "green";/*bleu son joueur et vert les joueurs adverses*/
          ctx.fill();

          ctx.fillStyle = "black"; /*couleur score*/
          ctx.font = "12px Arial";
          ctx.fillText(`Score: ${autreJoueur.score}`, autreJoueur.x - autreJoueur.taille, autreJoueur.y - autreJoueur.taille - 10);});

        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.fillStyle = "black"; /*coordonées*/
        ctx.font = "28px Arial";
        ctx.fillText(`X: ${joueur.x.toFixed(0)} Y: ${joueur.y.toFixed(0)}`, 10, 20);}}};

  useEffect(() => {dessiner();
  }, [joueurs, points]);

  const deplacerVersCible = () => { /*fonction qui calcule et qui envoie au serveur les nouvelles positions : fonctionnel*/
    const joueur = joueurs[socketRef.current.id];
    if (!joueur) return;

    const { dx, dy } = direction;
    const magnitude = Math.sqrt((dx*dx) + (dy*dy)); // distance entre la position du joueur et l'objectif 

    if (magnitude > 0) {
    const vx = ((dx / magnitude)*5); 
    const vy = ((dy / magnitude)*5);
    const nouvellePosition = {
  x: Math.max(0, Math.min(joueur.x + vx, TailleMapX)),
  y: Math.max(0, Math.min(joueur.y + vy, TailleMapY)),
  };

  socketRef.current.emit("majPosition", nouvellePosition);
}
};
  useEffect(() => {
  const canvas = canvasRef.current;
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}, 
[]);
  useEffect(() => {const interval = setInterval(deplacerVersCible, (8.33333333) /* 1000/120*/
    
  );return () => clearInterval(interval);}, [direction, joueurs]);

  const gererMouvement = (event: React.MouseEvent<HTMLCanvasElement>) => { /*fonctionnel */
  const canvas = canvasRef.current;
  const joueur = joueurs[socketRef.current.id];
  if (!canvas || !joueur) return;

  const rect = canvas.getBoundingClientRect();
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  const dx = canvasX - canvas.width /2;
  const dy = canvasY - canvas.height /2;

  setDirection({ dx, dy });
  };

  

  return (
    <div>
    <canvas ref={canvasRef} style={{ display: "block" }} onMouseMove={gererMouvement}/>
    </div>);
};

export default App;
