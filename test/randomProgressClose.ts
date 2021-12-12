import { TtyRenderWindow } from "../TtyRenderWindow.js";
import { RandomProgressRow } from "./util/RandomProgressRow.js";

const window = new TtyRenderWindow();
window.add(new RandomProgressRow(true));
window.add(new RandomProgressRow(true));
window.add(new RandomProgressRow(true));
window.add(new RandomProgressRow(true));
window.add(new RandomProgressRow(true));
window.add(new RandomProgressRow(true));
randomLog();

function randomLog() {
  window.interrupt(`Computed ${Math.floor(Math.random() * 10000)}`);
  if (window.height) {
    setTimeout(randomLog, Math.random() * 500);
  }
}
