# Week 6 Example 1 — Vertical Scrolling Shoot 'Em Up

## What This Example Demonstrates

> **Note for students:** This section is included in example files only to help you study. Do not include it in your Side Quest submissions.

This example introduces a vertical scrolling shoot 'em up. The world scrolls upward as the player advances. Dark square obstacles are loaded from a JSON file and scroll with the world — hitting one causes damage and a bounce. Orange blob enemies spawn from the top (max 3 at once) and move toward the player. Includes a full UI, health system, invincibility frames, and sound hooks.

- **World scrolling** — `scrollY` advances by `SCROLL_SPEED` each frame; enemies and obstacles move down by the same amount to stay in world coordinates
- **Obstacles from JSON** — `data/obstacles.json` stores each obstacle's world position and size; loaded in `preload()` with `loadJSON()`; built into objects in `setup()`
- **Circle-rectangle collision** — finds the closest point on the rectangle to the player centre using `constrain()`; if the distance is less than the player radius, a hit is registered
- **Bounce on hit** — a normalised direction vector away from the obstacle is calculated and stored as `bounceVX` / `bounceVY`; applied and decayed each frame in `applyBounce()` so the player regains control quickly
- **Max enemy cap** — `spawnEnemies()` checks `enemies.length` before spawning; never more than `MAX_ENEMIES` on screen at once
- **Scrolling background shapes** — generated in `setup()` with random world Y positions and scroll multipliers; shapes with a lower multiplier scroll slower, giving a sense of depth
- **Direction tracking** — `player.direction` stores the last direction moved as an `{ x, y }` unit vector; used to aim bullets and show the direction indicator dot
- **Shoot cooldown** — `player.shootTimer` counts down each frame; same pattern as invincibility frames
- **Health system with `lerpColor()`** — health bar shifts from green to red as health decreases
- **Scroll progress bar** — vertical bar on the right edge; `map()` converts `scrollY` to a fill height
- **Sound hooks** — all sound calls are commented out throughout; uncomment and add file paths to add audio

## Setup and Interaction Instructions

To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:**
- Move: WASD
- Shoot: Spacebar (shoots in the direction you last moved)
- Restart: R (after win or game over)

Dodge the dark square obstacles and shoot the orange blobs. Survive until the progress bar fills to win.

**Adding Your Own Sounds**
1. Add your sound files to `assets/sounds/`
2. In `preload()`, uncomment the `loadSound()` lines and update the file paths
3. Uncomment the `play()` or `loop()` calls in the relevant functions

**Editing the Obstacles**
Open `data/obstacles.json` to change obstacle positions and sizes. Each entry has:
- `x` — horizontal position in pixels
- `worldY` — vertical position in world coordinates (negative = higher up in the level)
- `size` — width and height of the square in pixels

**Opening the Chrome Console**
- **Windows:** Press `F12` or `Ctrl + Shift + J`, then click the **Console** tab
- **Mac:** Press `Cmd + Option + J`

## Assets

No external assets used. All visuals are generated with p5.js.

## References

N/A
