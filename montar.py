"""Gera index.html (a página do GitHub Pages) juntando template.html com os dados e os motions.

  dados/doc_<app>.json      explicação de cada gráfico (por app)
  dados/metricas.json       mapa de métricas (cálculo, onde ver, atualização)
  dados/sincronizacao.json  agenda das cargas
  dados/tutoriais.json      "Como fazer" (os 5 processos)
  dados/cena_tabelas.json   cena do motion das tabelas (gerada por motion/gerar_cenas.py)
  motion/motions.js         motor dos vídeos (Motion / motion.dev)
  assets/erp-*.jpg          capturas do ERP usadas no vídeo da seta
"""
import base64, json, os, datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
ORDEM = [41137, 41136, 41623, 41139, 41138, 41141, 41140, 41142]
ler = lambda *p: json.load(open(os.path.join(AQUI, *p), encoding='utf-8'))
seguro = lambda s: s.replace('</', '<\\/')

apps = []
for i in ORDEM:
    p = os.path.join(AQUI, 'dados', f'doc_{i}.json')
    if os.path.exists(p):
        apps.append(ler('dados', f'doc_{i}.json'))
    else:
        print('faltando', p)

dados = {'gerado': datetime.date.today().strftime('%d/%m/%Y'), 'apps': apps,
         'metricas': ler('dados', 'metricas.json'),
         'sincronizacao': ler('dados', 'sincronizacao.json'),
         'tutoriais': ler('dados', 'tutoriais.json')}

# Novidades: cada mudança aponta (ref) para um ponto da documentação. Aqui as refs são validadas,
# para que nenhum link da página Novidades quebre.
TIPOS = ('novo', 'alterado', 'removido', 'corrigido')
novidades = ler('dados', 'novidades.json') if os.path.exists(os.path.join(AQUI, 'dados', 'novidades.json')) else []
erros = []
for v in novidades:
    for m in v['mudancas']:
        r, tag = m['ref'], f"{v['versao']} ({m['texto'][:40]}...)"
        if m['tipo'] not in TIPOS:
            erros.append(f'{tag}: tipo invalido {m["tipo"]}')
        if 'metrica' in r:
            if not any(x['metrica'] == r['metrica'] for x in dados['metricas']):
                erros.append(f'{tag}: metrica nao existe: {r["metrica"]}')
        elif 'tutorial' in r:
            if not any(x['id'] == r['tutorial'] for x in dados['tutoriais']):
                erros.append(f'{tag}: tutorial nao existe: {r["tutorial"]}')
        elif 'app' in r:
            a = next((x for x in apps if x['app'].strip() == r['app']), None)
            d = a and next((x for x in a['dashboards'] if x['nome'] == r.get('dashboard')), None) if 'dashboard' in r else a
            if not a:
                erros.append(f'{tag}: app nao existe: {r["app"]}')
            elif 'dashboard' in r and not d:
                erros.append(f'{tag}: dashboard nao existe: {r["dashboard"]}')
            elif 'widget' in r and not any(w['titulo'] == r['widget'] for w in d['widgets']):
                erros.append(f'{tag}: widget nao existe: {r["widget"]}')
        else:
            erros.append(f'{tag}: ref sem app, metrica ou tutorial')
if erros:
    raise SystemExit('Novidades com referencia quebrada:\n  ' + '\n  '.join(erros))
dados['novidades'] = novidades

imgs = {}
for n in ('erp-1', 'erp-2', 'erp-3'):
    b = open(os.path.join(AQUI, 'assets', n + '.jpg'), 'rb').read()
    imgs[n] = 'data:image/jpeg;base64,' + base64.b64encode(b).decode()
motions = ('window.__IMG__ = ' + json.dumps(imgs) + ';\n'
           'window.__CENA__ = ' + json.dumps(ler('dados', 'cena_tabelas.json'), ensure_ascii=False) + ';\n'
           + open(os.path.join(AQUI, 'motion', 'motions.js'), encoding='utf-8').read())

CABECALHO = ('<!doctype html>\n<html lang="pt-BR">\n<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width, initial-scale=1">\n')
html = open(os.path.join(AQUI, 'template.html'), encoding='utf-8').read()
html = html.replace('/*__DATA__*/', seguro(json.dumps(dados, ensure_ascii=False)))
html = html.replace('/*__MOTIONS__*/', seguro(motions))
open(os.path.join(AQUI, 'index.html'), 'w', encoding='utf-8', newline='\n').write(CABECALHO + html)
print(len(apps), 'apps,', sum(len(d['widgets']) for a in apps for d in a['dashboards']), 'widgets,',
      len(dados['tutoriais']), 'tutoriais,', round(len(html) / 1024), 'KB')
