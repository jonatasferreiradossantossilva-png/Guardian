import { Step } from 'react-joyride';

export const GESTOR_STEPS: Step[] = [
  {
    target: '#menu-empresa',
    content: 'Passo 1 de 5: Comece preenchendo o perfil da sua empresa de transporte para habilitar a emissão automática de contratos.',
    placement: 'right',
  },
  {
    target: '#menu-escolas',
    content: 'Passo 2 de 5: Cadastre as escolas que suas vans atendem com nossa pesquisa automatizada de endereços por satélite.',
    placement: 'right',
  },
  {
    target: '#menu-veiculos',
    content: 'Passo 3 de 5: Cadastre os veículos da sua frota e defina o limite de assentos de cada van.',
    placement: 'right',
  },
  {
    target: '#menu-equipe',
    content: 'Passo 4 de 5: Adicione seus motoristas e monitores operacionais para poder associá-los às viagens e rotas.',
    placement: 'right',
  },
  {
    target: '#menu-rotas',
    content: 'Passo 5 de 5: Crie e otimize suas rotas diárias para calcular o melhor trajeto e gerar economia de combustível.',
    placement: 'right',
  },
];

export const AUTONOMO_STEPS: Step[] = [
  {
    target: '#menu-veiculos',
    content: 'Passo 1 de 3: Registre a sua van de transporte e determine a quantidade máxima de passageiros dela.',
    placement: 'right',
  },
  {
    target: '#menu-escolas',
    content: 'Passo 2 de 3: Selecione as escolas atendidas pelo seu trajeto na região para habilitar a inteligência de mapas.',
    placement: 'right',
  },
  {
    target: '#btn-share-link',
    content: 'Passo 3 de 3: Copie e envie seu link exclusivo para os pais no WhatsApp. Eles se cadastram sozinhos e você não digita nada!',
    placement: 'bottom',
  },
];

