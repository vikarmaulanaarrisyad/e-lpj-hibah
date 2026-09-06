const sharp = require('sharp');

async function clean() {
  const { data, info } = await sharp('public/templates/reference-kwitansi.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buf = Buffer.from(data);

  // Inpaint text area
  for (let y = 35; y < 345; y++) {
    for (let x = 245; x < 975; x++) {
      const idx = (y * width + x) * channels;
      const r = buf[idx];
      const g = buf[idx + 1];
      const b = buf[idx + 2];

      // Detect dark text
      if (r < 115 && g < 115 && b < 115) {
        let sampled = false;
        for (let dy = -7; dy <= 7; dy++) {
          const ny = y + dy;
          if (ny >= 35 && ny < 345) {
            const nIdx = (ny * width + x) * channels;
            const nr = buf[nIdx];
            const ng = buf[nIdx + 1];
            const nb = buf[nIdx + 2];
            if (nr > 175 && ng > 175 && nb > 155) {
              buf[idx] = nr;
              buf[idx + 1] = ng;
              buf[idx + 2] = nb;
              sampled = true;
              break;
            }
          }
        }
        if (!sampled) {
          buf[idx] = 250;
          buf[idx + 1] = 250;
          buf[idx + 2] = 245;
        }
      }

      // Detect and clean the cyan badge
      if (x >= 240 && x <= 490 && y >= 150 && y <= 215) {
        if ((b > 170 && g > 130 && r < 120) || (r > 225 && g > 225 && b > 225) || (r < 60 && g < 60 && b < 60)) {
          let sampled = false;
          for (let dx = -40; dx <= 40; dx += 10) {
            const nx = x + dx;
            if (nx < 240 || nx > 490) {
              const nIdx = (y * width + nx) * channels;
              buf[idx] = buf[nIdx];
              buf[idx + 1] = buf[nIdx + 1];
              buf[idx + 2] = buf[nIdx + 2];
              sampled = true;
              break;
            }
          }
          if (!sampled) {
            buf[idx] = 250;
            buf[idx + 1] = 250;
            buf[idx + 2] = 244;
          }
        }
      }
    }
  }

  await sharp(buf, { raw: { width, height, channels } })
    .png()
    .toFile('public/templates/kwitansi-clean-reference.png');

  console.log('Clean reference PNG created successfully!');
}

clean().catch(console.error);
