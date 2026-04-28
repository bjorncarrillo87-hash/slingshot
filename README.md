# 🐱 POUNCE — Physics-Based Cat Puzzle Game

A browser-based physics puzzle game built on [Matter.js](https://brm.io/matter-js/).
Launch cats at mice, pigeons, dogs, and squirrels across 10 handcrafted levels.

---

## How to Play

1. Serve locally: `python3 -m http.server` then open `http://localhost:8000`
2. Choose a **cat type** from the selector bar
3. **Click and drag** the cat on the slingshot, then **release** to fire
4. Eliminate all enemies to advance to the next level
5. Earn **boosters** via daily login bonus

---

## Cat Types

| Cat | Mass | Bounce | Style |
|-----|------|--------|-------|
| 🟠 Orange Tabby | 1.0 | 0.7 | Balanced, all-around |
| 🔶 Chonky Cat | 2.0 | 0.5 | Slow but hits hard |
| 🟫 Ninja Cat | 0.7 | 0.9 | Fast & bouncy |
| 🩷 Sleepy Cat | 1.2 | 1.1 | Unpredictable extra bounce |

## Enemy Types

| Enemy | Health | Points |
|-------|--------|--------|
| 🐭 Garden Mouse | 1 | 100 |
| 🐿️ Squirrel | 1 | 150 |
| 🕊️ Pigeon | 2 | 200 |
| 🐕 Dog Pup | 3 | 300 |

## Boosters

| Booster | Effect | Cost |
|---------|--------|------|
| ☄️ Meteor Shower | 2x impact damage | 99 💎 |
| 💪 Super Strength | +50% launch power | 99 💎 |
| 🐌 Slow Motion | Freeze enemies on shot | 99 💎 |
| 🐱 Cat Swarm | Launch 3 cats | 199 💎 |

---

## Project Structure

```
pounce/
├── index.html          # Game shell + HUD
├── style.css           # POUNCE branding & layout
├── script.js           # Game engine (Matter.js integration)
├── matter.js           # Physics engine
├── data/
│   ├── cats.js         # Cat type definitions
│   ├── enemies.js      # Enemy type definitions
│   ├── levels.js       # Level configurations (10 levels)
│   ├── game-config.js  # Global constants
│   └── monetization.js # Lives, gems, boosters, daily bonus
└── Assets/             # Images and icons
```

---

## Phases Completed

- **Phase 1** — Foundation setup (slingshot base)
- **Phase 2** — Rebrand to POUNCE (cats, enemies, POUNCE theme)
- **Phase 3** — 4 cat types with unique physics properties
- **Phase 4** — 4 enemy types + 10-level configuration system
- **Phase 5** — Monetization architecture (lives, gems, boosters, daily bonus)

---

Built with vanilla JavaScript + Matter.js. No frameworks, no backend.

---

## Original Foundation

<br>

<p id="project-title"><p>

<a href=#table-of-contents>![Slingshot Game](https://res.cloudinary.com/dn1e07eul/image/upload/v1659385854/Readme%20Headers/inter-021-slingshot_ia2pwd.png)</a>

<br>

<a href="https://emjose.github.io/slingshot/">![Slingshot Game](Assets/preview-021-slingshot-game.png)</a>

#

<p id="table-of-contents"><p>

<a href=#table-of-contents>![Table of Contents](https://res.cloudinary.com/dn1e07eul/image/upload/v1659241355/Readme%20Headers/inter-toc_euxbbw.png)</a>

- [100 Days of Code](#100days)
- [Installation](#installation)
- [Live Site](#live-site)
- [Resources](#resources)
- [Let's Connect!](#lets-connect)

<br>

#

<p id="100days"><p>

<a href=#100days>![#100DaysOfCode](https://res.cloudinary.com/dn1e07eul/image/upload/v1659389776/Readme%20Headers/inter-100hash_kjpgmt.png)</a>

### Day 21: March 1, 2021

- I love playing <a href="https://www.angrybirds.com/">Angry Birds</a>, and I followed a tutorial on creating a simple slingshot game with <a href="https://brm.io/matter-js/">Matter.js</a>.

- <a href="https://brm.io/matter-js/">Matter.js</a> is a powerful 2D rigid body physics engine written in JavaScript.

- This engine allows developers to create complex and dynamic interactions within their games and applications, making it a popular choice for game projects.

<br>

#

<p id="installation"><p>

<a href=#installation>![Installation](https://res.cloudinary.com/dn1e07eul/image/upload/v1659389842/Readme%20Headers/inter-installation_j9ixlq.png)</a>

#### 1. Git clone and cd into the repo folder:

```console
git clone git@github.com:emjose/slingshot.git && cd slingshot
```

#### 2. Run the command:

```console
open index.html
```

#### 3. Operate the slingshot, or directly move the Matter.js bodies with your cursor.

<br>

#

<p id="live-site"><p>

<a href="https://emjose.github.io/slingshot/">![Live Site](https://res.cloudinary.com/dn1e07eul/image/upload/v1659389947/Readme%20Headers/inter-live-site_ngkqcf.png)</a>

<a href="https://emjose.github.io/slingshot/">![Under Construction](Assets/021-slingshot.gif)</a>

• The **[Slingshot Game](https://emjose.github.io/slingshot/)** is best viewed or played on a desktop or laptop computer browser.

• The **[Slingshot Game](https://emjose.github.io/slingshot/)** is a [progressive web app](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps).

• The stack of shapes can be collapsed with the slingshot, or direct interaction with the mouse.

<br>

#

<p id="resources"><p>

<a href=#resources>![Resources](https://res.cloudinary.com/dn1e07eul/image/upload/v1659314247/Readme%20Headers/inter-resources_ncevbw.png)</a>

- #### [Slingshot Tutorial](https://youtu.be/PsL3iI61wl8) by [Red Stapler](https://www.youtube.com/channel/UCRthRrv06q1iOl86-tTKJhg)
- #### [Angry Birds with Matter.js](https://youtu.be/TDQzoe9nslY) by [The Coding Train](https://www.youtube.com/channel/UCvjgXvBlbQiydffZU7m1_aw)
- #### [Matter.js Home](https://brm.io/matter-js/) by [Liam](https://brm.io/)

- #### [Matter.js Demos](https://brm.io/matter-js/demo/#mixed)

- #### [My blog on how I created my Github READMEs](https://emmanueljose.medium.com/readme-a-makeover-story-b9c7be37a6de?sk=7ae6623d365409d875753e4604e42ffd)

<br>

#

<p id="lets-connect"><p>

<a href=#lets-connect>![Let's Connect!](https://res.cloudinary.com/dn1e07eul/image/upload/v1659314257/Readme%20Headers/inter-lets-connect_bv3kcd.png)</a>

<p><a href="https://twitter.com/Emmanuel_Labor"><img src="https://img.shields.io/badge/twitter-%231DA1F2.svg?&style=for-the-badge&logo=twitter&logoColor=white" height=30 width=90 alt="Twitter badge"></a> <a href="https://www.linkedin.com/in/emmanuelpjose/"><img src="https://img.shields.io/badge/linkedin-%230064e7.svg?&style=for-the-badge&logo=linkedin&logoColor=white" height=30 width=90 alt="Linkedin badge"></a> <a href="https://emmanueljose.medium.com/"><img src="https://img.shields.io/badge/medium-%238700f5.svg?&style=for-the-badge&logo=medium&logoColor=white" height=30 width=90 alt="Medium badge"></a> <a href="https://www.instagram.com/emmanuel_jose/"><img src="https://img.shields.io/badge/instagram-%23ff0077.svg?&style=for-the-badge&logo=instagram&logoColor=white" height=30 width=90 alt="Instagram badge"></a> <a href="mailto:emjose@gmail.com"><img src="https://img.shields.io/badge/gmail-%23fd1745.svg?&style=for-the-badge&logo=gmail&logoColor=white" height=30 width=90 alt="Gmail badge"></a> <a href="https://www.emmanuel-jose.com/"><img src="https://img.shields.io/badge/portfolio-%23FF0000.svg?&style=for-the-badge&logoColor=white" height=30 width=90 alt="Portfolio badge"></a> <a href="https://github.com/emjose"><img src="https://img.shields.io/badge/github-%23ff8e44.svg?&style=for-the-badge&logo=github&logoColor=white" height=30 width=90 alt="Github badge"></a></p>

#

<a href=#header>![Back to Top](https://res.cloudinary.com/dn1e07eul/image/upload/v1659314281/Readme%20Headers/inter-congrats_m4p3ck.png)</a>
