#!/bin/zsh
cd -- "${0:A:h}"
printf '\n작은 하루: http://127.0.0.1:4178\n이 창을 닫으면 게임 서버가 종료됩니다.\n\n'
python3 -m http.server 4178 --bind 127.0.0.1 --directory dist
