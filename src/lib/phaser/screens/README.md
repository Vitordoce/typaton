# Game Screens

This directory contains all UI scenes for the Typaton typing game. Each scene is implemented as a Phaser.Scene class that handles the rendering and user interaction for a specific game state.

## Screen Types

- **TitleScene**: The initial menu screen with game title and start button
- **GameScene**: The main gameplay screen (currently still at the parent directory level)
- **WinScene**: Displayed when the player completes all levels
- **GameOverScreen**: Displayed when the player loses the game

## Design Philosophy

The screens directory separates UI-focused components from game logic components. This structure:

1. **Improves Code Organization**: Clear separation between UI and game mechanics
2. **Simplifies Maintenance**: Each screen has a single responsibility
3. **Facilitates Scene Transitions**: Makes it easier to manage game flow

## Usage

Import scenes from the screens directory using the index.js file:

```typescript
import { TitleScene, WinScene, GameOverScreen } from './screens';
```

## Scene Transition Flow

1. TitleScene (menu) → GameScene (gameplay)
2. GameScene → WinScene (on completing all levels)
3. GameScene → GameOverScreen (on player defeat)
4. WinScene or GameOverScreen → TitleScene (to restart)

## Future Improvements

- Move GameScene.ts to this directory once fully refactored
- Create dedicated UI components shared across screens
- Implement screen transitions with effects 