@echo off
set PORT=9002
echo ======================================================
echo Liberando Porta %PORT% no Firewall para o Guardian PWA
echo ======================================================
echo.
echo Este script precisa ser executado como ADMINISTRADOR.
echo Se voce nao viu uma mensagem de confirmacao do Windows,
echo feche este arquivo e clique com o botao direito em
echo "liberar_guardian.bat" e selecione "Executar como Administrador".
echo.

netsh advfirewall firewall add rule name="Guardian_PWA_Access" dir=in action=allow protocol=TCP localport=%PORT%

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Nao foi possivel adicionar a regra. Voce esqueceu de rodar como Administrador?
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCESSO] Porta %PORT% liberada! 
echo Agora seu celular devera conseguir acessar o PC via IP: 192.168.0.30:%PORT%
echo.
pause
