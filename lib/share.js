// Setzt mehrere Kleidungsstueck-Fotos zu einem einzigen Bild zusammen,
// damit ein Outfit als ein Foto in der Community geteilt werden kann.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const r = w / h;
  let sx, sy, sw, sh;
  if (ir > r) {
    sh = img.height;
    sw = sh * r;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / r;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export async function compositeOutfitImage(items, size = 640) {
  const pics = items.filter((i) => i.image).slice(0, 4);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f7f5';
  ctx.fillRect(0, 0, size, size);

  const gap = 10;
  const imgs = await Promise.all(pics.map((i) => loadImage(i.image)));

  if (imgs.length === 1) {
    drawCover(ctx, imgs[0], 0, 0, size, size);
  } else if (imgs.length === 2) {
    const w = (size - gap) / 2;
    drawCover(ctx, imgs[0], 0, 0, w, size);
    drawCover(ctx, imgs[1], w + gap, 0, w, size);
  } else if (imgs.length === 3) {
    const topH = (size - gap) * 0.58;
    const botH = size - topH - gap;
    const botW = (size - gap) / 2;
    drawCover(ctx, imgs[0], 0, 0, size, topH);
    drawCover(ctx, imgs[1], 0, topH + gap, botW, botH);
    drawCover(ctx, imgs[2], botW + gap, topH + gap, botW, botH);
  } else {
    const w = (size - gap) / 2;
    const h = (size - gap) / 2;
    drawCover(ctx, imgs[0], 0, 0, w, h);
    drawCover(ctx, imgs[1], w + gap, 0, w, h);
    drawCover(ctx, imgs[2], 0, h + gap, w, h);
    drawCover(ctx, imgs[3], w + gap, h + gap, w, h);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}
