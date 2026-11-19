"""Rebuilds models/index.json from every model file in models/.
Run after adding or removing models:  python3 tools/make-index.py"""
import json,os
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','models')
out=[]
for f in sorted(os.listdir(d)):
    if f=='index.json' or not f.endswith('.json'):
        continue
    try:
        m=json.load(open(os.path.join(d,f),encoding='utf-8'))
    except Exception:
        continue
    types=sorted({s.get('type') for s in m.get('shapes',[]) if s.get('type')})[:4]
    out.append({'file':f,'name':m.get('name',f[:-5]),'category':m.get('category','Other'),'types':types})
json.dump({'models':out},open(os.path.join(d,'index.json'),'w'),indent=1)
print(len(out),'models indexed')
