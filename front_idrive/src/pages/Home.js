import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Footer from "../components/Footer";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="content">
        <h1>Bienvenido a iDrive</h1>
        <p>Gestiona tus clases de conducción fácilmente.</p>
        <Button variant="primary" size="lg" onClick={() => navigate("/login")}>
          Iniciar Sesión
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
