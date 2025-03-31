export const buttonGlowStyle = `
  @keyframes rainbow-glow {
      0% { box-shadow: 0 0 10px 3px rgba(128, 0, 128, 0.7); } /* Purple */
      50% { box-shadow: 0 0 10px 3px rgba(255, 105, 180, 0.7); } /* Pink */
      100% { box-shadow: 0 0 10px 3px rgba(128, 0, 128, 0.7); } /* Back to Purple */
  }
  .rainbow-glow {
      animation: rainbow-glow 2s infinite;
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes pulse-shadow {
    0% { text-shadow: 0 0 4px rgba(255,0,255,0.5), 0 0 10px rgba(255,0,255,0.3); }
    50% { text-shadow: 0 0 8px rgba(255,0,255,0.8), 0 0 20px rgba(255,0,255,0.6); }
    100% { text-shadow: 0 0 4px rgba(255,0,255,0.5), 0 0 10px rgba(255,0,255,0.3); }
  }
  
  @keyframes cascade-animation {
    0% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-25px) rotate(10deg); color: #f0f; }
    100% { transform: translateY(0) rotate(0); }
  }
  
  .click-me-letter {
    display: inline-block;
    animation: pulse-shadow 3s infinite;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .cascade-container.animating .click-me-letter {
    animation: cascade-animation 0.5s ease-in-out forwards;
  }
  
  /* Game phase indicator animations */
  @keyframes phase-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .phase-active {
    animation: phase-pulse 2s infinite;
  }
  
  /* Enhanced tooltip animation */
  @keyframes tooltip-glow {
    0% { box-shadow: 0 0 5px rgba(99,102,241,0.3); }
    50% { box-shadow: 0 0 15px rgba(99,102,241,0.6); }
    100% { box-shadow: 0 0 5px rgba(99,102,241,0.3); }
  }
  
  .tooltip-container {
    animation: tooltip-glow 3s infinite;
  }
`;