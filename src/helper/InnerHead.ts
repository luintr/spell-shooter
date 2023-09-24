export class InnerHead {
  constructor() {
    this.applyFontStyles();
  }

  applyFontStyles(): void {
    const assetPath: string = GAME_ASSETS.font;
    const fontStyles: string = `
      @font-face {
        font-family: "Silkscreen";
        src: url(${assetPath}) format("woff2");
        font-weight: normal;
        font-style: normal;
      }
      body, h1, p, div, span, button, p, canvas, input {
        font-family: "Silkscreen", sans-serif;
      }
    `;
    const styleElement: HTMLElement = document.createElement("style");
    styleElement.innerHTML = fontStyles;
    document.head.appendChild(styleElement);
  }
}