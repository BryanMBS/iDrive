import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} iDrive Software- Todos los derechos reservados</p>
    </footer>
  );
}

export default Footer;
