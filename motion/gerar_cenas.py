"""Gera dados/cena_tabelas.json: a cena do motion "como as tabelas se ligam".

Lê o modelo real do app Faturamento (saída de `lumo info app:41137 --full --format json`),
pega a tabela de fato (itens da NF de saída) e as dimensões ligadas a ela, e calcula a
posição de cada caixa num layout radial. A página só anima o que este script decide.

Uso:  py motion/gerar_cenas.py <info_41137.json>
"""
import json, os, sys

AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FATO = 'Itens da Nota Fiscal de Saída'
# dimensões que o usuário final mais usa em relatório (as outras ficam fora para a cena respirar)
ESCOLHIDAS = ['Calendario', 'Clientes', 'Produtos', 'Tipo de operação de saída', 'Representante', 'Nota Fiscal de Saida']
APELIDO = {'Calendario': 'Calendário', 'Nota Fiscal de Saida': 'Nota Fiscal', 'Tipo de operação de saída': 'Tipo de operação'}
CAMPOS = {  # colunas que aparecem dentro de cada caixa (rótulos de tela)
    FATO: ['Valor líquido', 'Valor bruto', 'Quantidade'],
    'Calendario': ['Data', 'Mês', 'Ano'],
    'Clientes': ['Razão social', 'UF', 'Cidade'],
    'Produtos': ['Descrição', 'Grupo'],
    'Tipo de operação de saída': ['Descrição', 'Participa Indicadores'],
    'Representante': ['Nome'],
    'Nota Fiscal de Saida': ['Número', 'Status NF', 'Emissão'],
}
METRICAS = [  # rótulo, fórmula curta (as mesmas do mapa de métricas)
    ('Faturamento líquido', 'Σ Valor líquido'),
    ('Ticket médio', 'Valor líquido ÷ nº de notas'),
    ('Margem %', 'Margem de contribuição ÷ ROL'),
]


def main(caminho):
    b = json.load(open(caminho, encoding='utf-8'))['data']['payload']['body']
    nome = {t['tableId']: t['nome'] for t in b['tables']}
    fato_id = next(i for i, n in nome.items() if n == FATO)

    ligadas = {}
    for r in b['relationships']:
        a, c = r['from_table_id'], r['to_table_id']
        if c == fato_id and nome.get(a) in ESCOLHIDAS:
            ligadas[nome[a]] = (r['from_column'], r['to_column'], 'direta')
    # dimensões ligadas ao fato através da nota (cliente, representante)
    nota_id = next(i for i, n in nome.items() if n == 'Nota Fiscal de Saida')
    for r in b['relationships']:
        a, c = r['from_table_id'], r['to_table_id']
        if c == nota_id and nome.get(a) in ESCOLHIDAS and nome[a] not in ligadas:
            ligadas[nome[a]] = (r['from_column'], r['to_column'], 'via Nota Fiscal')

    ordem = [n for n in ESCOLHIDAS if n in ligadas]
    # layout em colunas (centro da caixa, em % do palco 16:9): quem liga pela nota fica à
    # esquerda dela; quem liga direto no fato fica à direita. Nenhuma linha cruza o fato.
    # caixas com 17% de largura: sobra ~10% entre colunas para o rótulo da chave
    POS = {'Calendario': (10, 18), 'Clientes': (10, 50), 'Representante': (10, 82),
           'Nota Fiscal de Saida': (36, 50), 'Produtos': (91, 18), 'Tipo de operação de saída': (91, 50)}
    nos = [{'id': 'fato', 'nome': 'Itens da NF de saída', 'papel': 'fato', 'x': 63, 'y': 50, 'campos': CAMPOS[FATO]}]
    arestas = []
    ids = {n: f'd{i}' for i, n in enumerate(ordem)}
    for i, n in enumerate(ordem):
        x, y = POS[n]
        nid = f'd{i}'
        nos.append({'id': nid, 'nome': APELIDO.get(n, n), 'papel': 'dimensao', 'x': round(x, 1), 'y': round(y, 1), 'campos': CAMPOS.get(n, [])})
        de, para, via = ligadas[n]
        alvo = ids['Nota Fiscal de Saida'] if via != 'direta' else 'fato'
        arestas.append({'de': nid, 'para': alvo, 'chave': para, 'chave_completa': f'{de} → {para}', 'via': via})

    cena = {'app': b['nome'], 'nos': nos, 'arestas': arestas,
            'metricas': [{'nome': m, 'formula': f} for m, f in METRICAS],
            'filtro': {'tabela': 'Tipo de operação', 'campo': 'Participa Indicadores', 'valor': 'Participa'}}
    destino = os.path.join(AQUI, 'dados', 'cena_tabelas.json')
    json.dump(cena, open(destino, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(nos)} tabelas, {len(arestas)} ligações → {destino}')
    for a in arestas:
        print('  ', next(n['nome'] for n in nos if n['id'] == a['de']), a['chave'], a['via'])


if __name__ == '__main__':
    main(sys.argv[1])
