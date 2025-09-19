<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://costcodle.com">
    <img src="assets/CD.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">COSTCODLE UNLIMITED</h3>

  <p align="center">
    A TypeScript-powered, Wordle-esque daily guessing game for Costco food products!
    <br />
    <a href="https://github.com/virenmohindra/costcodle-unlimited"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://costcodle.com">View Demo</a>
    ·
    <a href="https://github.com/virenmohindra/costcodle-unlimited/issues">Report Bug</a>
    ·
    <a href="https://github.com/virenmohindra/costcodle-unlimited/issues">Request Feature</a>
  </p>

[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#features">Features</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#development">Development</a></li>
      </ul>
    </li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://costcodle.com)

Guess the COSTCODLE in 6 tries.

* Each guess must be a valid price.
* Incorrect guesses will help guide you to the target price.

If you guess within 5% of the target price, you win!

A new COSTCODLE is available every day!

This is a modernized TypeScript version with enhanced features, improved developer experience, and automated deployment.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![TypeScript][TypeScript.ts]][TypeScript-url]
* [![HTML][HTML5]][HTML-url]
* [![CSS][CSS3]][CSS-url]
* [![GitHub Actions][GitHub-Actions]][GitHub-Actions-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Features

* **🎯 Daily & Archive Modes**: Play today's game or browse historical games
* **📱 Mobile Responsive**: Optimized for all screen sizes
* **⚡ Offline Support**: Service worker enables offline gameplay
* **🎨 Smooth Animations**: Enhanced UI with CSS animations
* **♿ Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
* **📊 Statistics Tracking**: Track your wins, streaks, and performance
* **🔗 Easy Sharing**: Share results with emojis on social media
* **🔧 TypeScript**: Full type safety and modern development experience

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

* Node.js 18+ and npm
  ```sh
  node --version
  npm --version
  ```

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/virenmohindra/costcodle-unlimited.git
   cd costcodle-unlimited
   ```

2. Install dependencies
   ```sh
   npm install
   ```

3. Build the project
   ```sh
   npm run build
   ```

4. Start the development server
   ```sh
   npm start
   ```

The game will be available at `http://localhost:8000`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Development

For active development with auto-rebuilding:

```sh
npm run dev
```

This starts TypeScript compilation in watch mode and serves the built files.

**Available Scripts:**
- `npm run build` - Full production build
- `npm run dev` - Development mode with watch
- `npm run type-check` - TypeScript type checking
- `npm run clean` - Clean build directory
- `npm run deploy` - Deploy to GitHub Pages

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deployment

This project is configured for automatic deployment to GitHub Pages via GitHub Actions.

**Automatic Deployment:**
1. Push changes to the `main` branch
2. GitHub Actions automatically builds and deploys
3. TypeScript is compiled and optimized
4. Site is deployed to GitHub Pages

**Manual Deployment:**
```sh
npm run deploy
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Architecture

### Project Structure
```
src/
├── modules/           # Core TypeScript modules
│   ├── constants.ts   # Game configuration and constants
│   ├── utils.ts       # Utility functions
│   ├── dom.ts         # DOM management and UI components
│   ├── state.ts       # Reactive state management
│   ├── game.ts        # Game logic and mechanics
│   └── app.ts         # Main application coordinator
├── types/
│   └── game.ts        # TypeScript type definitions
├── sw.ts              # Service worker for offline support
└── main.ts            # Application entry point

dist/                  # Built output (auto-generated)
scripts/
└── searchBar.js       # Third-party currency input library
styles/                # CSS stylesheets
assets/                # Static assets (images, icons)
```

### Key Technologies
- **TypeScript**: Full type safety and modern JavaScript features
- **ES2022 Modules**: Native browser module support
- **Service Worker**: Offline functionality and caching
- **CSS Custom Properties**: Dynamic theming system
- **GitHub Actions**: Automated CI/CD pipeline

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

**Original Creator:**
Zachary Kermitz - zakkermitz@gmail.com

**TypeScript Modernization + Unlimited Mode:**
viren

Project Link: [https://github.com/virenmohindra/costcodle-unlimited](https://github.com/virenmohindra/costcodle-unlimited)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

This project would not have been possible without the following resources:

* [Costco Food Database](https://costcofdb.com/food-database)
* [Wordle](https://www.nytimes.com/games/wordle/index.html)
* [Tradle](https://oec.world/en/tradle/)
* [Currency Format Input Field by Wade Williams](https://codepen.io/559wade/pen/LRzEjj)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[license-shield]: https://img.shields.io/github/license/KermWasTaken/costcodle.svg?style=for-the-badge
[license-url]: https://github.com/KermWasTaken/costcodle/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/zacharykermitz
[product-screenshot]: assets/costcodle.png
[HTML5]: https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white
[HTML-url]: https://en.wikipedia.org/wiki/HTML
[CSS3]: https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white
[CSS-url]: https://en.wikipedia.org/wiki/CSS
[JavaScript]: https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E
[JavaScript-url]: https://en.wikipedia.org/wiki/JavaScript
[TypeScript.ts]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[GitHub-Actions]: https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white
[GitHub-Actions-url]: https://github.com/features/actions
