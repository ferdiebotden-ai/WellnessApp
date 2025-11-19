@echo off
git config core.longpaths true
git checkout main
git reset --hard eac41b7
git push origin main --force
echo.
echo PR URL: https://github.com/ferdiebotden-ai/WellnessApp/pull/new/feature/update-codebase-with-latest-changes

