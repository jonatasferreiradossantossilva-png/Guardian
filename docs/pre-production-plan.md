
# Plano de Pré-Produção - Guardian Intelligence

Este documento detalha os passos necessários para a transição do protótipo estável para o ambiente de produção real (MVP Scale).

## 1. Migração de Dados e Infraestrutura Real
- **Virada do Firebase:** Substituir o `MockDataProvider` pela conexão real com o Firestore.
- **Sincronização de Blueprint:** Atualizar o `backend.json` com as novas entidades criadas (Avisos, Histórico de ROI, Triagem, Mensagens Predefinidas).
- **Carga de Dados Inicial:** Importar a base de 190.000 escolas para o Firestore para permitir a busca instantânea em produção.

## 2. Autenticação e Segurança (RBAC)
- **Implementação do Auth:** Substituir o login simulado pelo `Firebase Authentication` (Email/Senha e Google).
- **Regras de Segurança (Firestore Rules):** Implementar o modelo de permissões real:
    - **Gestores:** Acesso total (CRUD) a todas as coleções.
    - **Motoristas:** Escrita apenas em sua localização e atualização de status dos alunos de sua rota.
    - **Pais:** Leitura estrita apenas dos dados de seus próprios filhos, faturas e mensagens enviadas/recebidas.
- **Vínculos de UID:** Mapear os IDs de usuário reais para os documentos de `parents` e `drivers`.

## 3. Estratégia Mobile (Android & iOS)
- **Configuração PWA (Fast Release):**
    - Criar `manifest.json` e configurar Service Workers para instalação direta pelo navegador (sem taxas de loja).
    - Definir ícones e splash screens do Guardian.
- **Preparação Nativa (App Stores):**
    - Integrar **Capacitor.js** para gerar os pacotes `.apk` (Android) e `.ipa` (iOS).
    - Validar fluxos de permissão de Câmera (OCR/QR Code) e GPS (Telemetria) em background para iOS.

## 4. Resiliência de IA e Telemetria
- **Hardening de Prompts:** Refinar as instruções do Gemini para lidar com fotos de documentos com baixa iluminação ou borrões.
- **Slicing de Waypoints:** Validar o limite da API Geoapify para rotas com mais de 25 paradas, garantindo que o traçado do mapa nunca quebre.
- **Cálculo de Proximidade:** Migrar a fórmula de Haversine para uma Cloud Function ou garantir sua execução eficiente no cliente para evitar latência nos alertas de 800m.

## 5. Validação Jurídica e Financeira
- **Assinatura Digital:** Validar o motor de preenchimento automático de contratos com um consultor jurídico.
- **Gateway de Pagamento:** Substituir o simulador de Pix por um webhook real (ex: Stark Bank, EFI ou Mercado Pago) para confirmação automática de mensalidades.

---
**Status Atual:** Sistema Saneado (Erro Zero) e pronto para início da Fase 1 de Migração.
