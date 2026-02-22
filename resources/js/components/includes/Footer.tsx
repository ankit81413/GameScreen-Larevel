import React from 'react'

export default function Footer() {
  return (
    <>
      <div className="footer">
    <div className="footer-content">
      <div className="footer-section">
        <h3>GAME SCREEN</h3>
        <p>Welcome to our Gamescreen! We strive to provide the best collection of high-quality wallpapers for
          your devices.</p>
      </div>
      <div className="footer-section">
        <h3 className="center">Explore</h3>
        <ul className="footer-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="latest.html">latest</a></li>
          <li><a href="About Us.html">About Us</a></li>
          <li><a href="Contact Us.html">Contact</a></li>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Contact</h3>
        <p>Email: wallpaper.gamescreen.com</p>
        <a href="https://youtube.com/@Gamescreen-kp9qy?si=4ZfnIlQTciAu7Vk_" className="contact_link youtube"><i className="fa-brands fa-youtube"></i>
          Youtube: Gamescreen</a><br/>

        <a href="https://www.instagram.com/_gamescreen?igsh=bDVvNzVkcWhrbTZh" className="contact_link insta"><i className="fa-brands fa-instagram"></i>
          Instagram: _gamescreen</a>


        {/* <!-- <p>Instagram: _gamescreen</p> --> */}
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2023 Gamescreen. All Rights Reserved.</p>
    </div>
  </div>
    </>
  )
}
