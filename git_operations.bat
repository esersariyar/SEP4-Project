@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: ANSI renk kodları için gerekli ayar
reg add HKEY_CURRENT_USER\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f > nul 2>&1

:: Emojiler
set "OK=✅"
set "HATA=❌"
set "BILGI=ℹ️"
set "BRANCH=🌿"
set "PUSH=⬆️"
set "PULL=⬇️"
set "MENU=📋"
set "STASH=📦"
set "MERGE=🔄"
set "DELETE=🗑️"
set "STATUS=📊"
set "CLONE=📥"
set "HISTORY=📜"
set "RESET=↩️"
set "TAG=🏷️"
set "REMOTE=🌐"
set "SURPRISE=🎵"

:menu
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 📋 GIT İŞLEMLERİ MENÜSÜ                                   ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. 📥 Repository Clone                                    ║
echo ║ 2. 🌿 Mevcut Branch'e Push Yap                            ║
echo ║ 3. 🌿 Yeni Branch Oluştur ve Push Yap                     ║
echo ║ 4. ⬇️ Pull İşlemi Yap                                     ║
echo ║ 5. ℹ️ Mevcut Branch'i Göster                              ║
echo ║ 6. ℹ️ Tüm Branch'leri Listele                             ║
echo ║ 7. 📊 Değişiklikleri Göster                               ║
echo ║ 8. 📦 Stash İşlemleri                                     ║
echo ║ 9. 🔄 Merge İşlemi Yap                                    ║
echo ║ 10. 🗑️ Branch Sil                                         ║
echo ║ 11. 📜 Commit Geçmişi                                     ║
echo ║ 12. ↩️ Geri Gitme İşlemleri                               ║
echo ║ 13. 🏷️ Tag İşlemleri                                      ║
echo ║ 14. 🌐 Remote İşlemleri                                   ║
echo ║ 0. ❌ Çıkış                                               ║
echo ╚════════════════════════════════════════════════════════════╝

set /p secim="Seçiminiz (0-14): "

if "%secim%"=="1" goto clone_repo
if "%secim%"=="2" goto mevcut_branch_push
if "%secim%"=="3" goto yeni_branch_push
if "%secim%"=="4" goto pull_yap
if "%secim%"=="5" goto branch_goster
if "%secim%"=="6" goto branch_listele
if "%secim%"=="7" goto degisiklikleri_goster
if "%secim%"=="8" goto stash_menu
if "%secim%"=="9" goto merge_yap
if "%secim%"=="10" goto branch_sil
if "%secim%"=="11" goto commit_history
if "%secim%"=="12" goto reset_menu
if "%secim%"=="13" goto tag_menu
if "%secim%"=="14" goto remote_menu
if "%secim%"=="0" goto cikis
if "%secim%"=="42" goto rick_roll
if "%secim%"=="1337" goto rick_roll
if "%secim%"=="999" goto rick_roll

echo ❌ Geçersiz seçim! Lütfen 0-14 arası bir sayı girin.
timeout /t 2 > nul
goto menu

:clone_repo
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 📥 REPOSITORY CLONE                                       ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. HTTPS ile Clone                                         ║
echo ║ 2. SSH ile Clone                                           ║
echo ║ 3. ↩️ Ana Menüye Dön                                      ║
echo ╚════════════════════════════════════════════════════════════╝

set /p clone_secim="Seçiminiz (1-3): "

if "%clone_secim%"=="1" (
    set /p repo_url="📥 Repository URL'sini giriniz (HTTPS): "
    git clone %repo_url%
    if !errorlevel! neq 0 (
        echo ❌ Clone işlemi başarısız oldu!
    ) else (
        echo ✅ Repository başarıyla clone edildi!
    )
    pause
    goto menu
)
if "%clone_secim%"=="2" (
    set /p repo_url="📥 Repository URL'sini giriniz (SSH): "
    git clone %repo_url%
    if !errorlevel! neq 0 (
        echo ❌ Clone işlemi başarısız oldu!
    ) else (
        echo ✅ Repository başarıyla clone edildi!
    )
    pause
    goto menu
)
if "%clone_secim%"=="3" goto menu
goto clone_repo

:mevcut_branch_push
echo ℹ️ Mevcut branch'e push yapılıyor...
git add .
set /p commit_msg="📝 Commit mesajını giriniz: "
git commit -m "%commit_msg%"
git push
if %errorlevel% neq 0 (
    echo ❌ Push işlemi başarısız oldu!
) else (
    echo ✅ Push işlemi başarılı!
)
pause
goto menu

:yeni_branch_push
set /p branch_name="🌿 Yeni branch adını giriniz: "
echo ℹ️ %branch_name% branch'ine geçiş yapılıyor...
git checkout -b %branch_name%
if %errorlevel% neq 0 (
    echo ❌ Branch oluşturma başarısız oldu!
    pause
    goto menu
)
git add .
set /p commit_msg="📝 İlk commit mesajını giriniz: "
git commit -m "%commit_msg%"
git push -u origin %branch_name%
if %errorlevel% neq 0 (
    echo ❌ Push işlemi başarısız oldu!
) else (
    echo ✅ Branch oluşturma ve push işlemi başarılı!
)
pause
goto menu

:pull_yap
echo ⬇️ Pull işlemi yapılıyor...
git pull
if %errorlevel% neq 0 (
    echo ❌ Pull işlemi başarısız oldu!
) else (
    echo ✅ Pull işlemi başarılı!
)
pause
goto menu

:branch_goster
echo ℹ️ Mevcut branch bilgisi:
git branch --show-current
pause
goto menu

:branch_listele
echo ℹ️ Tüm branch'ler listeleniyor:
git branch -a
pause
goto menu

:degisiklikleri_goster
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 📊 DEĞİŞİKLİKLERİ GÖSTER                                  ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. 📊 Genel Durum                                         ║
echo ║ 2. 📊 Detaylı Değişiklikler                               ║
echo ║ 3. 📊 Belirli Dosyadaki Değişiklikler                     ║
echo ║ 4. ↩️ Ana Menüye Dön                                      ║
echo ╚════════════════════════════════════════════════════════════╝

set /p degisiklik_secim="Seçiminiz (1-4): "

if "%degisiklik_secim%"=="1" (
    git status
    pause
    goto degisiklikleri_goster
)
if "%degisiklik_secim%"=="2" (
    git diff --stat
    echo.
    git diff
    pause
    goto degisiklikleri_goster
)
if "%degisiklik_secim%"=="3" (
    set /p dosya="📄 Dosya yolunu giriniz: "
    git diff "%dosya%"
    pause
    goto degisiklikleri_goster
)
if "%degisiklik_secim%"=="4" goto menu
goto degisiklikleri_goster

:stash_menu
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 📦 STASH İŞLEMLERİ                                        ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. 📦 Değişiklikleri Stash'le                             ║
echo ║ 2. 📦 Stash Listesini Göster                              ║
echo ║ 3. 📦 Son Stash'i Uygula                                  ║
echo ║ 4. 📦 Stash'i Sil                                         ║
echo ║ 5. ↩️ Ana Menüye Dön                                      ║
echo ╚════════════════════════════════════════════════════════════╝

set /p stash_secim="Seçiminiz (1-5): "

if "%stash_secim%"=="1" (
    set /p stash_msg="📝 Stash mesajını giriniz: "
    git stash save "%stash_msg%"
    if !errorlevel! neq 0 (
        echo ❌ Stash işlemi başarısız oldu!
    ) else (
        echo ✅ Değişiklikler stash'lendi!
    )
    pause
    goto stash_menu
)
if "%stash_secim%"=="2" (
    git stash list
    pause
    goto stash_menu
)
if "%stash_secim%"=="3" (
    git stash apply
    if !errorlevel! neq 0 (
        echo ❌ Stash uygulama başarısız oldu!
    ) else (
        echo ✅ Stash başarıyla uygulandı!
    )
    pause
    goto stash_menu
)
if "%stash_secim%"=="4" (
    git stash list
    set /p stash_index="Silinecek stash numarasını giriniz (örn: stash@{0}): "
    git stash drop %stash_index%
    if !errorlevel! neq 0 (
        echo ❌ Stash silme başarısız oldu!
    ) else (
        echo ✅ Stash başarıyla silindi!
    )
    pause
    goto stash_menu
)
if "%stash_secim%"=="5" goto menu
goto stash_menu

:merge_yap
echo 🔄 Merge işlemi yapılacak branch'i seçin:
git branch -a
echo.
set /p merge_branch="🌿 Merge edilecek branch adını giriniz: "
git merge %merge_branch%
if !errorlevel! neq 0 (
    echo ❌ Merge işlemi başarısız oldu!
    echo ℹ️ Çakışmaları manuel olarak çözmeniz gerekebilir.
) else (
    echo ✅ Merge işlemi başarılı!
)
pause
goto menu

:branch_sil
echo 🗑️ Silinecek branch'i seçin:
git branch -a
echo.
set /p silinecek_branch="🗑️ Silinecek branch adını giriniz: "
echo ℹ️ %silinecek_branch% branch'i siliniyor...
git branch -d %silinecek_branch%
if !errorlevel! neq 0 (
    echo ❌ Yerel branch silme başarısız oldu!
) else (
    echo ✅ Yerel branch silindi!
)
set /p remote_sil="Remote'dan da silmek istiyor musunuz? (E/H): "
if /i "%remote_sil%"=="E" (
    git push origin --delete %silinecek_branch%
    if !errorlevel! neq 0 (
        echo ❌ Remote branch silme başarısız oldu!
    ) else (
        echo ✅ Remote branch silindi!
    )
)
pause
goto menu

:commit_history
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 📜 COMMIT GEÇMİŞİ                                         ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. 📜 Son 10 Commit                                       ║
echo ║ 2. 📜 Belirli Sayıda Commit                               ║
echo ║ 3. 📜 Belirli Kullanıcının Commitleri                     ║
echo ║ 4. 📜 Belirli Dosyanın Commit Geçmişi                     ║
echo ║ 5. ↩️ Ana Menüye Dön                                      ║
echo ╚════════════════════════════════════════════════════════════╝

set /p history_secim="Seçiminiz (1-5): "

if "%history_secim%"=="1" (
    git log --oneline -n 10
    pause
    goto commit_history
)
if "%history_secim%"=="2" (
    set /p commit_sayisi="📜 Kaç commit gösterilsin: "
    git log --oneline -n %commit_sayisi%
    pause
    goto commit_history
)
if "%history_secim%"=="3" (
    set /p kullanici="👤 Kullanıcı adını giriniz: "
    git log --author="%kullanici%" --oneline
    pause
    goto commit_history
)
if "%history_secim%"=="4" (
    set /p dosya="📄 Dosya yolunu giriniz: "
    git log --oneline -- "%dosya%"
    pause
    goto commit_history
)
if "%history_secim%"=="5" goto menu
goto commit_history

:reset_menu
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ ↩️ GERİ GİTME İŞLEMLERİ                                   ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. ↩️ Soft Reset (Değişiklikler Korunur)                  ║
echo ║ 2. ↩️ Mixed Reset (Staging Temizlenir)                    ║
echo ║ 3. ↩️ Hard Reset (Tüm Değişiklikler Silinir)              ║
echo ║ 4. ↩️ Belirli Bir Commit'e Dön                            ║
echo ║ 5. ↩️ Son Commit'i Geri Al (Revert)                       ║
echo ║ 6. ↩️ Ana Menüye Dön                                      ║
echo ╚════════════════════════════════════════════════════════════╝

set /p reset_secim="Seçiminiz (1-6): "

if "%reset_secim%"=="1" (
    git reset --soft HEAD~1
    echo ✅ Soft reset başarılı!
    pause
    goto reset_menu
)
if "%reset_secim%"=="2" (
    git reset HEAD~1
    echo ✅ Mixed reset başarılı!
    pause
    goto reset_menu
)
if "%reset_secim%"=="3" (
    echo ⚠️ DİKKAT: Bu işlem tüm değişiklikleri silecek!
    set /p onay="Devam etmek istiyor musunuz? (E/H): "
    if /i "%onay%"=="E" (
        git reset --hard HEAD~1
        echo ✅ Hard reset başarılı!
    )
    pause
    goto reset_menu
)
if "%reset_secim%"=="4" (
    git log --oneline -n 10
    echo.
    set /p commit_hash="Commit hash'ini giriniz: "
    git reset --soft %commit_hash%
    echo ✅ Reset başarılı!
    pause
    goto reset_menu
)
if "%reset_secim%"=="5" (
    git revert HEAD
    echo ✅ Son commit geri alındı!
    pause
    goto reset_menu
)
if "%reset_secim%"=="6" goto menu
goto reset_menu

:tag_menu
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 🏷️ TAG İŞLEMLERİ                                         ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. 🏷️ Tag Listele                                         ║
echo ║ 2. 🏷️ Yeni Tag Oluştur                                    ║
echo ║ 3. 🏷️ Tag Sil                                             ║
echo ║ 4. 🏷️ Tag'leri Push Et                                    ║
echo ║ 5. ↩️ Ana Menüye Dön                                      ║
echo ╚════════════════════════════════════════════════════════════╝

set /p tag_secim="Seçiminiz (1-5): "

if "%tag_secim%"=="1" (
    git tag -l
    pause
    goto tag_menu
)
if "%tag_secim%"=="2" (
    set /p tag_name="🏷️ Tag adını giriniz: "
    set /p tag_message="📝 Tag mesajını giriniz: "
    git tag -a %tag_name% -m "%tag_message%"
    echo ✅ Tag oluşturuldu!
    pause
    goto tag_menu
)
if "%tag_secim%"=="3" (
    git tag -l
    echo.
    set /p tag_name="🗑️ Silinecek tag adını giriniz: "
    git tag -d %tag_name%
    echo ✅ Tag silindi!
    pause
    goto tag_menu
)
if "%tag_secim%"=="4" (
    git push origin --tags
    echo ✅ Tag'ler push edildi!
    pause
    goto tag_menu
)
if "%tag_secim%"=="5" goto menu
goto tag_menu

:remote_menu
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 🌐 REMOTE İŞLEMLERİ                                       ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║ 1. 🌐 Remote Listele                                      ║
echo ║ 2. 🌐 Remote Ekle                                         ║
echo ║ 3. 🌐 Remote Sil                                          ║
echo ║ 4. 🌐 Remote URL Değiştir                                 ║
echo ║ 5. ↩️ Ana Menüye Dön                                      ║
echo ╚════════════════════════════════════════════════════════════╝

set /p remote_secim="Seçiminiz (1-5): "

if "%remote_secim%"=="1" (
    git remote -v
    pause
    goto remote_menu
)
if "%remote_secim%"=="2" (
    set /p remote_name="🌐 Remote adını giriniz: "
    set /p remote_url="🌐 Remote URL'sini giriniz: "
    git remote add %remote_name% %remote_url%
    echo ✅ Remote eklendi!
    pause
    goto remote_menu
)
if "%remote_secim%"=="3" (
    git remote -v
    echo.
    set /p remote_name="🗑️ Silinecek remote adını giriniz: "
    git remote remove %remote_name%
    echo ✅ Remote silindi!
    pause
    goto remote_menu
)
if "%remote_secim%"=="4" (
    git remote -v
    echo.
    set /p remote_name="🌐 Değiştirilecek remote adını giriniz: "
    set /p new_url="🌐 Yeni URL'yi giriniz: "
    git remote set-url %remote_name% %new_url%
    echo ✅ Remote URL güncellendi!
    pause
    goto remote_menu
)
if "%remote_secim%"=="5" goto menu
goto remote_menu

:cikis
echo ✅ İyi çalışmalar!
timeout /t 2 > nul
exit /b 0

:rick_roll
cls
echo ╔════════════════════════════════════════════════════════════╗
echo ║ 🎵 SÜRPRİZ!                                                ║
echo ║                                                            ║
echo ║ Never gonna give you up...                                 ║
echo ║ Never gonna let you down...                                ║
echo ║                                                            ║
echo ║ Rick Astley - Never Gonna Give You Up                      ║
echo ║                                                            ║
echo ║ 🎵 Müzik açılıyor...                                       ║
echo ╚════════════════════════════════════════════════════════════╝

:: Rick Roll videosunu varsayılan tarayıcıda aç
start "" "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

:: Biraz bekleyip ana menüye dön
timeout /t 3 > nul
goto menu 