https://127.0.0.1:8443/#home

ft_transcendence/
│
├── app/                    # Main web application (TypeScript)
│   ├── dist/               # Compiled JS output (from TypeScript)
│   ├── node_modules/       # Dependencies
│   └── src/                # Source TypeScript / frontend
│       ├── game/           # Pong engine and logic (TS)
│       └── views/          # UI screens (home, game, tournament)
│
├── nginx/                  # Nginx HTTPS reverse proxy + static hosting
│   ├── ssl/                # Certificates
│   └── nginx.conf          # Server configuration
│
├── docker-compose.yml      # Docker orchestration
└── README.md               # This file

