"""Finalize the supplied field evidence, explicitly retaining missing results.

This snapshot is deliberately separate from build_reports.py's strict completion
gate. Finalized documents do not imply complete device evidence.
"""
from pathlib import Path
import json, math, re
from html import escape
from reportlab.platypus import Paragraph, Table, Spacer, PageBreak, Image, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from build_reports import ROOT, CW, styles, p, table, build, MatrixFigure, inline

D=json.loads((ROOT/'measurements.json').read_text(encoding='utf-8-sig'))

def vec(v):
    if isinstance(v,dict):v=[v[k] for k in ('x','y','z')]
    return '('+', '.join(f'{x:.6f}' for x in v)+')'

def array(v):return '['+', '.join(f'{x:.6g}' for x in v)+']'

def word_count(flows):
    def text(f):
        if isinstance(f,Paragraph):return f.getPlainText()
        if isinstance(f,Table):return ' '.join(text(c) for row in f._cellvalues for c in row)
        if isinstance(f,MatrixFigure):return 'Pose matrix column order normal elements 4 5 6 position 12 13 14 tilt acos ny length n accept 12 degrees'
        return ''
    return len(re.findall(r'\S+',' '.join(text(f) for f in flows)))

def image_pair(story,title,left,right,left_caption,right_caption):
    story += [PageBreak(),p(title,'h1')]
    imgs=[]
    for file in (left,right):
        img=Image(str(ROOT/'evidence'/file))
        img._restrictSize((CW-15)/2,535)
        imgs.append(img)
    t=Table([imgs],colWidths=[CW/2,CW/2],hAlign='LEFT')
    t.setStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),7)])
    story += [t,Spacer(1,12),p(left_caption+' '+right_caption,'small')]

def english_report():
    story=[p('A speaker in the room','title'),p('Tair Asset | AIB-2401 | 242458<br/>PA3 - AR product preview | 28 October 2026','meta')]
    story += [p('ID 242458 selects a 0.25 m wide, 0.30 m deep, 1.00 m tall speaker: single placement, 12-degree tolerance, front facing the user at placement. A valid second tap replaces the object. The model uses seven primitives, standard materials and two lights.'),
      p('<b>Test record.</b> Borrowed Android; model and actual OS version were not recorded. The browser reported Chrome 152.0.0.0. Original screenshots and four JSON exports are retained. This report finalizes the available evidence; missing measurements remain explicitly missing. No device demo video was supplied.','small')]
    story += [p('E1 - Reference spaces','h1'),p('<b>Prediction.</b> A roughly one-metre forward walk changes local camera coordinates. The same hit has different viewer and local coordinates.'),
      p('<b>Result.</b> In export-1, the last session starts at '+vec(D['camera_start_local'])+' m. The later capture is '+vec(D['camera_after_1m_local'])+' m: displacement 1.279 m. Between the two manual captures it is 1.165 m. The physical route was not tape-verified. Both hit matrices below come from the same first capture.'),
      p('Viewer hit: '+escape(array(D['hit_viewer_matrix'])),'small'),
      p('Local hit: '+escape(array(D['hit_local_matrix'])),'small'),
      p('<b>Explanation.</b> Viewer follows the phone and supplies the ray frame. Local supplies the scene frame for placement. These matrices describe one hit in different frames; different numbers do not imply separate physical hits. [1, 2]')]
    story += [p('E2 - Hits, anchors and session setup','h1'),p('<b>Prediction.</b> Anchors may respond differently to mapping corrections than a saved local matrix; neither guarantees zero drift.'),
      p('<b>Result.</b> Photos show anchors on and off near a paper reference. The observer reported no noticeable shift after returning, but the note did not identify the mode. Neither return drift was measured in centimetres. Anchors-on creation is logged; the supplied logs omit the off session. No quantitative advantage is established.'),
      p('<b>Explanation.</b> A hit is an intersection for one frame. PA3 requires a separate createAnchor call and repeated anchor-pose updates. Ch. 7 slide 16 distinguishes this from transform-only placement. Local-floor changes the origin to floor level; it does not improve the hit-test algorithm. [1, 2]'),
      p('The PDF names GL/layer setup, setReferenceSpaceType and setSession as three tasks; slide 9 groups them differently. In three@0.186.1, setSession handles conditional GL compatibility (427-431) and layer/render state (451-453 or 496-498). We still explicitly choose local with setReferenceSpaceType (setter 311-315); setSession requests that type at 525-526 and starts XR animation at 528-529. Our awaited setSession call connects the session. A separate setupWebGLLayer is unnecessary. [1, 3]','small')]
    story += [PageBreak(),p('E3 - Reading a placement','h1'),p('<b>Prediction.</b> An upward surface within 12 degrees permits placement; a larger directed-normal angle produces red and rejects placement.')]
    m=D['placement_hit_matrix'];n=m[4:7];length=math.hypot(*n);ratio=n[1]/length
    rows=[['X axis','Normal (+Y)','Z axis','Position']]+[[f'{m[r+4*c]:.6g}' for c in range(4)] for r in range(4)]
    story += [p('<b>Result.</b> The first successful placement in export-0 has these 16 values, displayed as a 4 x 4 matrix (the JSON array is column-major):'),
      table(rows,[CW/4]*4),Spacer(1,9),
      p('Position = '+vec(m[12:15])+'. Normal = '+escape(array(n))+f'. |n| = {length:.6f}; n dot up / |n| = {ratio:.6f}; acos(1) x 180/pi = 0 degrees. The separate red capture has n approximately (0,-1,0), giving acos(-1) = 180 degrees.'),
      p('<b>Explanation.</b> Position is array elements 12-14; normal is 4-6. Compare the normal with up, not the phone angle. Photos prove green and red states, but do not establish a controlled tilted-board test or the exact 12-degree boundary on hardware. A downward normal must be rejected, not made valid by taking its absolute value. [2]')]
    story += [p('E4 - Surface search','h1'),p('<b>Prediction.</b> Surface appearance may change detection time. The three labels are choices made by the tester, not automatic material recognition.'),
      p('<b>Result.</b> New-session trials in export-3 are below. The patterned material is unconfirmed; a white table is photographed. No third-material timing exists. Later manual hits at 0.088 and 0.037 seconds reuse an active session and are excluded from this comparison.'),
      table([['Surface label','Seconds to first hit','Outcome'],['Patterned','8.666','Hit found'],['Plain white','No hit within 20 s','Timeout'],['Third surface','Not recorded','Not established']],[CW*.31,CW*.37,CW*.32]),Spacer(1,9),
      p('<b>Explanation.</b> Camera feature points and motion sensors jointly support visual-inertial odometry: estimating movement and the surrounding geometry. Our page consumes resulting poses and hits. The timeout shows detection was not immediate; these incomplete trials cannot isolate texture from lighting, movement or prior mapping. The 20-second window is our protocol. [2]')]
    story += [PageBreak(),p('E5 - Physical scale','h1'),p('<b>Prediction.</b> The one-metre model should appear one metre tall.'),
      p('<b>Result.</b> Box3 verifies 0.25 x 1.00 x 0.300000005 m, base y=0. No ruler, known-size comparison or measuring-app result was supplied. Physical height and centimetre error are therefore unmeasured.'),
      p('<b>Explanation.</b> Code bounds verify geometry, not field scale. Tracking/surface estimation and perspective or ruler-reading error are two plausible sources of physical discrepancy. [2, 4]')]
    retail=('The white-labelled trial produced no hit within 20 seconds. A shopper may abandon the preview; show scanning guidance and a retry action. '
      'The tester could not reliably reproduce red on a tilted object; a saved hit instead had a downward normal and 180-degree angle. Unclear placement feedback can undermine trust; explain uncertain surface orientation and offer rescanning. '
      'This implementation reads device poses, hit transforms and anchor poses. It does not read raw camera pixels, request a full room mesh or upload pose logs. Tell users why tracking permission is needed and that downloaded diagnostics contain spatial coordinates. These limits describe this implementation, not every WebXR extension.')
    assert len(retail.split())<=150
    story += [p('E6 - Retail use and privacy','h1'),p(retail),
      p('Development log','h1'),p('Driver membranes initially disappeared behind surround caps.<br/>Preview inspection and depth comparison exposed the overlap.<br/>The membrane depth was corrected in commit e10f7e2.<br/>Geometry checks then confirmed the bounds and visible layer ordering.','small'),
      p('Sources and limits','h1'),p('1. Supplied Baruah Ch. 7 PDF pp. 7-11, 14-19; slides 8-9 and 11-16.<br/>2. Supplied PA3 assignment, Tasks A-E and E1-E6.<br/>3. Pinned <link href="https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webxr/WebXRManager.js" color="#4d4f44">three@0.186.1 WebXRManager.js</link>, inspected as E2(c) requires.<br/>4. Supplied Ch. 5 PDF pp. 7-10, 26, 35; Ch. 6 pp. 9-10, 24-27.<br/>Field sources: evidence/export-0.json through export-3.json and original screenshots. Export-2 is contained in export-3 and is not an independent repeat. Missing: demo, physical scale/drift, third timed surface, device identity and console verification.','small')]
    image_pair(story,'Device evidence - ring states','green.png','red-180.png',
      'Left: green, valid 0 degrees, no product.',
      'Right: red, too tilted 180 degrees, one existing product. These separate photos do not prove rejection of a particular tap or a controlled board angle.')
    image_pair(story,'Device evidence - anchors on','anchors-on-view-1.png','anchors-on-view-2.png',
      'Two viewpoints with anchors on and a paper reference.',
      'No ruler reading or independently verified three-metre route is available.')
    image_pair(story,'Device evidence - anchors off','anchors-off-view-1.png','anchors-off-view-2.png',
      'Two viewpoints with anchors off and a paper reference.',
      'They document the fallback mode; they do not quantify drift.')
    image_pair(story,'Device evidence - photographed surfaces','white-table.png','laptop-lid.png',
      'Left: white tabletop, with the plain-white selection visible.',
      'Right: laptop lid photographed with a green ring. Its exact detected plane and a separate first-hit time are unverified.')
    words=word_count(story)
    if words>1200:raise ValueError(f'Final report exceeds 1200 words: {words}')
    build(ROOT/'writeup.pdf',story)
    return {'report_words':words,'e6_words':len(retail.split())}

def defence():
    source=(ROOT/'DEFENSE_FINAL_RU.md').read_text(encoding='utf-8').splitlines()
    story=[];i=0
    while i<len(source):
        line=source[i].strip()
        if not line:i+=1;continue
        if line=='[[PAGEBREAK]]':story.append(PageBreak());i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(source) and source[i].strip().startswith('|'):
                cells=[x.strip() for x in source[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[-: ]+',x) for x in cells):rows.append([inline(x) for x in cells])
                i+=1
            story += [table(rows,[CW*.32,CW*.68]),Spacer(1,9)];continue
        if line.startswith('# '):style=styles['title'];line=line[2:]
        elif line.startswith('## '):style=styles['h1'];line=line[3:]
        else:style=styles['body']
        story.append(Paragraph(inline(line),style));i+=1
    build(ROOT/'DEFENSE_FINAL_RU.pdf',story)

if __name__=='__main__':
    stats=english_report();defence()
    from pypdf import PdfReader
    stats.update(report_pages=len(PdfReader(ROOT/'writeup.pdf').pages),defence_pages=len(PdfReader(ROOT/'DEFENSE_FINAL_RU.pdf').pages),all_device_evidence_complete=False)
    (ROOT/'final_report_stats.json').write_text(json.dumps(stats,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(stats))
