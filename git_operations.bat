@echo off
echo Git islemleri basliyor...

:: Pull islemi
echo Pull islemi yapiliyor...
git pull
if %errorlevel% neq 0 (
    echo Pull islemi basarisiz oldu!
    pause
    exit /b 1
)

:: Branch adini sor
set /p branch_name="Branch adini giriniz: "

:: Yeni branch olustur ve gecis yap
echo %branch_name% branch'ine gecis yapiliyor...
git checkout -b %branch_name%
if %errorlevel% neq 0 (
    echo Branch olusturma/guncelleme basarisiz oldu!
    pause
    exit /b 1
)

:: Degisiklikleri push'la
echo Degisiklikler push'lanıyor...
git push -u origin %branch_name%
if %errorlevel% neq 0 (
    echo Push islemi basarisiz oldu!
    pause
    exit /b 1
)

:: Branch'i sil
echo %branch_name% branch'i siliniyor...
git checkout main
git branch -d %branch_name%
git push origin --delete %branch_name%

echo Islemler tamamlandi!
pause 