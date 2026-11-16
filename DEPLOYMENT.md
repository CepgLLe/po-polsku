# GitHub: последовательность публикации

Этот проект — статический сайт: серверное приложение и сборка не нужны. GitHub Actions будет автоматически публиковать сайт на GitHub Pages после каждого push в `main`.

## Сейчас

- Локальный репозиторий создан в `D:/Languages/Polski/polski-trainer`.
- Ошибка `detected dubious ownership` исправлена добавлением точечной записи `safe.directory` для этой папки.
- Workflow для GitHub Pages находится в `.github/workflows/deploy.yml`.
- Первый коммит и удалённый репозиторий GitHub ещё не созданы.

## Опубликовать в первый раз

1. На GitHub создай новый пустой репозиторий, например `polski-trainer`. Не добавляй к нему README, лицензию или `.gitignore`: они уже есть локально.
2. В терминале открой папку проекта:

   ```powershell
   cd D:\Languages\Polski\polski-trainer
   ```

3. Проверь, что Git видит проект и исключает только локальный мусор:

   ```powershell
   git status
   ```

4. Добавь файлы и создай первый коммит:

   ```powershell
   git add .
   git status
   git commit -m "Initial project setup"
   ```

   Перед коммитом в `git status` проверь список файлов. Не добавляй пароли, токены или другие секреты.

5. Подключи созданный репозиторий. Замени `ТВОЙ_ЛОГИН` своим именем пользователя GitHub:

   ```powershell
   git remote add origin https://github.com/ТВОЙ_ЛОГИН/polski-trainer.git
   git push -u origin main
   ```

6. На GitHub открой **Settings → Pages** и в разделе **Build and deployment** выбери **Source: GitHub Actions**.
7. Открой вкладку **Actions**, дождись успешного запуска **Deploy to GitHub Pages**. Адрес будет вида `https://ТВОЙ_ЛОГИН.github.io/polski-trainer/`.

Если репозиторий называется `ТВОЙ_ЛОГИН.github.io`, адрес будет `https://ТВОЙ_ЛОГИН.github.io/`.

## Обновлять сайт

После изменений:

```powershell
git add .
git commit -m "Describe the change"
git push
```

GitHub Actions опубликует новую версию. Проверяй результат на вкладке **Actions** и затем открой адрес сайта.

## Важные детали

- Настройки GitHub Pages публикуют сайт, но сами по себе не синхронизируют данные между устройствами. Сейчас прогресс тренировки хранится в `localStorage` конкретного браузера. Слова и фразы, находящиеся в репозитории, загрузятся на каждом устройстве.
- Если репозиторий будет публичным, его файлы и данные в `data/` смогут читать все. На GitHub Free Pages доступны для публичных репозиториев; публикация из приватного репозитория требует подходящего платного тарифа. При этом опубликованный сайт доступен всем в интернете даже тогда, когда сам репозиторий приватный. Не публикуй секреты или личные данные.
- Если Git снова покажет `dubious ownership`, проверь, что открыт именно каталог `polski-trainer`, и посмотри текущую запись:

  ```powershell
  git config --global --get-all safe.directory
  ```

  Нужная запись — `D:/Languages/Polski/polski-trainer`. Не используй `safe.directory *`: это отключает защиту для всех репозиториев.
