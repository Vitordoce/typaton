# Power-Ups Documentation

This document describes the power-up system in Typaton, including available power-up types, their effects, and how they're implemented in the game.

## Power-Up Types

The game features four distinct power-ups that provide different advantages to the player:

| Power-Up | Color | Effect | Duration |
|----------|-------|--------|----------|
| FREEZE | Cyan | Freezes all words on screen | 3 seconds |
| SLOW | Green | Reduces word speed by 50% | 5 seconds |
| BOMB | Red | Destroys all words on screen | Instant |
| SHIELD | Yellow | Protects from one missed word | Until hit |

## How Power-Ups Work

### Obtaining Power-Ups

1. Power-ups appear randomly as special words during gameplay
2. There's a 5% chance for any spawned word to be a power-up
3. Power-up words have a distinctive rainbow blinking effect
4. Type the power-up word correctly to collect it
5. Collected power-ups are stored in your inventory (bottom left corner)

### Activating Power-Ups

Power-ups must be manually activated by the player. When activated:

- **FREEZE**: All words on screen stop moving for 3 seconds
- **SLOW**: All words move at half speed for 5 seconds
- **BOMB**: Instantly destroys all words on screen
- **SHIELD**: Provides protection from one missed word

### Visual Effects

When a power-up is activated, the game displays:
- A large text announcement in the center of the screen
- Particle effects around the announcement
- A visual indicator showing the power-up is active (for timed power-ups)

## Implementation Details

### Power-Up Manager

The `PowerUpManager` class handles all power-up related functionality:

- Tracks collected and active power-ups
- Manages power-up timers and effects
- Provides methods to check power-up states
- Handles visual effects and UI updates

### Key Methods

- `shouldBePowerUp()`: Determines if a word should be a power-up (5% chance)
- `collectPowerUp(type)`: Adds a power-up to the player's inventory
- `activatePowerUp(type)`: Activates a power-up from inventory
- `isFreezeActive()`: Checks if the freeze effect is currently active
- `getSlowFactor()`: Returns 0.5 if slow is active, otherwise 1.0
- `hasActiveShield()`: Checks if shield protection is available

### Game Events

Power-ups trigger the following events (defined in GameEvents.ts):

- `POWERUP_COLLECTED`: When a player successfully types a power-up word
- `POWERUP_ACTIVATED`: When a player activates a power-up from inventory
- `POWERUP_EXPIRED`: When a timed power-up effect ends

## Power-Up Strategy Tips

- **FREEZE**: Best used when many words are approaching the center
- **SLOW**: Helpful when the game speed becomes overwhelming
- **BOMB**: Save for emergency situations with too many words on screen
- **SHIELD**: Keep as a safety net for difficult words

## Technical Notes

- Power-up effects are implemented through the game's event system
- The BOMB effect is handled by the game scene directly
- SHIELD is consumed automatically when a word reaches the center
- Active power-ups are updated each frame in the update loop