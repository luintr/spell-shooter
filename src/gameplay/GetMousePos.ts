  // Get the mouse position
  export function getMousePos(canvas: HTMLCanvasElement, e: any) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
      y: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
  }