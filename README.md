# Fruit Frenzy

A colorful Fruit Ninja-style game made with HTML, CSS, and vanilla JavaScript. Everything runs in your browser, with no installation, external libraries, API keys, or backend.

## Open and play

1. Open this project folder on your computer.
2. Double-click `index.html` to open it in a modern browser, such as Chrome, Firefox, Edge, or Safari.
3. Click **LET’S SLICE**. Hold the mouse button and drag through flying fruit. On a touchscreen, press and drag your finger.
4. Each fruit earns 10 points. Missing three fruits or slicing a bomb ends the game. Survive for 60 seconds to finish a round.
5. Click **SLICE AGAIN** to restart. Use the sound button for optional synthesized sound effects.

The game pauses while its browser tab is hidden. Your best score is saved locally when your browser permits it. Emoji fruit appearance varies slightly by operating system.

## Files

- `index.html`: The start screen, game canvas, score display, and game-over screen.
- `style.css`: Responsive arcade styling and menu animations.
- `game.js`: Fruit physics, mouse and touch input, slicing effects, scoring, lives, bombs, timer, and sounds.
- `README.md`: These instructions.
- `.nojekyll`: Tells GitHub Pages to serve these static files directly.

## Quick manual checks

- Start a game and drag across a fruit: the score increases by 10, with fruit halves, particles, and a glowing trail.
- Let a fruit fall: one heart dims. The third missed fruit ends the game.
- Slice a bomb: the game ends immediately.
- Finish a round: the timer counts down from 60 and ends the game at zero.
- Restart: the score, timer, lives, and fruit reset.
- Try a narrow window or phone: the game fits the screen and supports touch dragging.
- Toggle sound, switch tabs, and return: audio is optional and hidden tabs pause gameplay.

## Deploy on GitHub Pages

1. Create a GitHub repository and upload these files to its root folder. Keep `index.html` at the root.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose your `main` branch and **/ (root)**, then click **Save**.
5. Once GitHub finishes publishing, open the website link shown on the Pages settings screen.

No build command or package installation is needed.
