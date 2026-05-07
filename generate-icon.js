const sharp = require('sharp');
const fs = require('fs');

// Create a simple icon with a music theme
const svgImage = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1a1a1a"/>
  <circle cx="256" cy="256" r="200" fill="#ff6b35"/>
  <g transform="translate(256, 256)">
    <!-- Musical note -->
    <circle cx="-40" cy="-30" r="25" fill="#ffffff"/>
    <rect x="-35" y="0" width="8" height="80" fill="#ffffff"/>
    <circle cx="40" cy="0" r="30" fill="#ffffff"/>
    <rect x="45" y="30" width="8" height="60" fill="#ffffff"/>
    <!-- Connecting line -->
    <path d="M -27 0 Q 0 -30 45 30" stroke="#ffffff" stroke-width="4" fill="none"/>
  </g>
</svg>
`;

sharp(Buffer.from(svgImage))
  .png()
  .toFile('public/icon.png', (err, info) => {
    if (err) {
      console.error('Error creating icon:', err);
    } else {
      console.log('Icon created successfully:', info);
    }
  });
