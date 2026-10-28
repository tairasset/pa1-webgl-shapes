"""Build the English PA3 write-up and Russian defence guide.

Run from the project directory with Python and reportlab. Field evidence belongs
in measurements.json. The script never invents a device result or recording.
"""
from pathlib import Path
import json, math, re
from html import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, PageBreak, KeepTogether, Image, Flowable)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from validate_measurements import validate_measurements

ROOT = Path(__file__).resolve().parents[1]
FONTS = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Body', str(FONTS/'arial.ttf')))
pdfmetrics.registerFont(TTFont('BodyBold', str(FONTS/'arialbd.ttf')))
pdfmetrics.registerFont(TTFont('BodyItalic', str(FONTS/'ariali.ttf')))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='BodyItalic',boldItalic='BodyBold')
pdfmetrics.registerFont(TTFont('Display', str(FONTS/'georgia.ttf')))
INK=HexColor('#252720'); MUTED=HexColor('#63665d'); RUST=HexColor('#904c34'); PALE=HexColor('#f1eee6')
W,H=A4; M=48; CW=W-2*M
styles={
 'title':ParagraphStyle('title',fontName='Display',fontSize=29,leading=33,textColor=black,spaceAfter=12),
 'h1':ParagraphStyle('h1',fontName='Display',fontSize=19,leading=24,textColor=black,spaceBefore=14,spaceAfter=9,keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='BodyBold',fontSize=11,leading=15,textColor=black,spaceBefore=12,spaceAfter=7,keepWithNext=True),
 'body':ParagraphStyle('body',fontName='Body',fontSize=9.4,leading=14.3,textColor=INK,spaceAfter=9),
 'small':ParagraphStyle('small',fontName='Body',fontSize=8,leading=11.5,textColor=MUTED,spaceAfter=7),
 'meta':ParagraphStyle('meta',fontName='Body',fontSize=9,leading=14,textColor=MUTED,spaceAfter=14),
 'cell':ParagraphStyle('cell',fontName='Body',fontSize=8.1,leading=11.8,textColor=INK),
 'headercell':ParagraphStyle('headercell',fontName='BodyBold',fontSize=8.1,leading=11.8,textColor=white),
}
all_report_text=[]
def p(text,kind='body',count=True):
    if count: all_report_text.append(re.sub('<[^>]+>',' ',text))
    return Paragraph(text,styles[kind])
def table(rows,widths=None):
    cells=[[Paragraph(str(c),styles['headercell' if i==0 else 'cell']) for c in row] for i,row in enumerate(rows)]
    t=Table(cells,colWidths=widths or [CW/len(rows[0])]*len(rows[0]),repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('ROWBACKGROUNDS',(0,1),(-1,-1),[white,PALE]),('GRID',(0,0),(-1,-1),.4,HexColor('#d9d9d9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    return t
def page(c,doc):
    c.setFillColor(MUTED);c.setFont('Body',8)
    c.drawString(M,25,'PA3  /  242458  /  Tair Asset')
    c.drawRightString(W-M,25,f'{doc.page}')
def build(path,story):
    SimpleDocTemplate(str(path),pagesize=A4,rightMargin=M,leftMargin=M,topMargin=43,bottomMargin=43,title=path.stem.replace('_',' '),author='Tair Asset').build(story,onFirstPage=page,onLaterPages=page)

class MatrixFigure(Flowable):
    def __init__(self): super().__init__();self.width=CW;self.height=128
    def draw(self):
        c=self.canv;c.setFillColor(INK);c.setFont('BodyBold',9)
        c.drawString(0,113,'The pose matrix is stored column by column')
        labels=[['Xx','nx','Zx','px'],['Xy','ny','Zy','py'],['Xz','nz','Zz','pz'],['0','0','0','1']]
        for r,row in enumerate(labels):
            for col,value in enumerate(row):
                x=25+col*52;y=82-r*20
                c.setFillColor(RUST if col==3 else (HexColor('#48764c') if col==1 else INK));c.setFont('Body',10);c.drawCentredString(x,y,value)
        c.setStrokeColor(MUTED);c.line(0,4,0,98);c.line(210,4,210,98)
        c.setFont('Body',8.5);c.setFillColor(INK)
        for i,line in enumerate(['Normal n = elements 4, 5, 6','Position p = elements 12, 13, 14','tilt = acos(ny / length(n))','Accept when tilt <= 12 degrees']):c.drawString(243,84-i*19,line)

def report():
    d=json.loads((ROOT/'measurements.json').read_text(encoding='utf-8-sig'))
    image_keys=['green','red','scale','drift_on','drift_off']
    complete=not validate_measurements(d,ROOT)
    story=[p('AR floor speaker preview','title'),p('Tair Asset · AIB 2401 · Student ID 242458<br/>AR VR XR Applications · Practical assignment 3','meta'),p('This page places a 25 × 30 × 100 cm speaker on a real surface. ID 242458 selects single placement, a 12 degree tilt limit and a front that faces the user at placement. A second valid tap replaces the first placement.')]
    story.append(p(('Device '+escape(str(d['device_model']))+' · '+escape(str(d['browser_version']))) if complete else '<b>Device evidence pending.</b> Geometry and simulated logic have been checked. No compatible-device recording, physical measurements or device screenshots are available yet. This document is a technical draft, not a completed field report.','small'))
    story += [p('E1 Reference spaces','h1'),p('<b>Prediction.</b> Walking about one metre should change the camera position in local space by roughly that displacement. A fixed hit should have different viewer-relative coordinates as the phone moves.')]
    if complete:
        story.append(p('<b>Result.</b> Camera local positions were '+escape(str(d['camera_start_local']))+' and '+escape(str(d['camera_after_1m_local']))+'. Viewer and local hit matrices are printed with the evidence below.'))
    else:story.append(p('<b>Result.</b> The camera positions and paired hit poses have not been recorded on a compatible device. Capture pose exports all three from the same active frame.'))
    story.append(p('<b>Explanation.</b> Viewer space follows the phone, so it gives the hit-test ray its direction. Local space provides the scene coordinate system for both the hit and the rendered object. A pose describes the same point relative to the requested reference space; different coordinates do not imply different physical hits. [1, 2]'))
    story += [p('E2 Hit results and persistent attachment','h1'),p('<b>Prediction.</b> After a three-metre walk away and back, anchor-based attachment may follow map corrections better than a frozen local matrix. Neither method guarantees zero drift.')]
    if complete:story.append(p(f"<b>Result.</b> Measured return drift was {d['drift_anchors_on_cm']} cm with anchors and {d['drift_anchors_off_cm']} cm without. The floor mark and device screenshots are the physical reference."))
    else:story.append(p('<b>Result.</b> Return drift is unmeasured. Simulated checks verify anchor deletion and asynchronous cleanup, not real tracking stability.'))
    story.append(p('<b>Explanation.</b> A hit result is a frame-specific intersection, not an automatically saved spatial anchor. An anchor separately tracks a pose as mapping changes. Local-floor changes the origin to estimated floor height; it does not improve the hit-test algorithm. [1–3]'))
    story.append(p('In npm three@0.186.1, WebXRManager.setSession already handles GL compatibility (427–431), the XR layer and render state (451–453, or 496–498), the reference space (525–526) and XR animation (528–529). A separate setupWebGLLayer is unnecessary. These lines refer to the pinned npm file, not the differently numbered r186 tag. [4]'))
    story += [PageBreak(),p('E3 Reading the surface pose','h1'),p('<b>Prediction.</b> A normal within 12 degrees of world up permits placement; a steeper normal produces a red ring and rejects the tap.'),MatrixFigure(),Spacer(1,10)]
    if complete:
        m=d['hit_local_matrix'];length=math.sqrt(sum(m[i]**2 for i in (4,5,6)));angle=math.degrees(math.acos(max(-1,min(1,m[5]/length))))
        story.append(p('<b>Result.</b> Recorded matrix: '+', '.join(f'{x:.6f}' for x in m)+f'. Normal = ({m[4]:.6f}, {m[5]:.6f}, {m[6]:.6f}); its length is {length:.6f}; acos({m[5]/length:.6f}) = {angle:.3f} degrees.'))
    else:story.append(p('<b>Result.</b> The two required device screenshots and one measured matrix are pending. Automated rotations at 0, 8, 12, 16, 45, 90 and 180 degrees passed the mathematical filter check.'))
    story.append(p('<b>Explanation.</b> The Y column is the surface normal. Its dot product with world up equals its Y component. Normalise, clamp the cosine and apply acos. The exact 12 degree boundary is accepted; 12.001 degrees is rejected. The position column does not determine tilt.'))
    story += [p('E4 Surface detection','h1'),p('<b>Prediction.</b> A textured surface should usually offer more stable visual features than a plain white or reflective surface. This is a hypothesis, not a measured ordering.')]
    rows=[['Surface','First hit seconds','Success']]
    if complete:
        for item in d['surface_trials']:rows.append([escape(str(item['surface'])),str(item['seconds']) if item['success'] else 'No hit in 20 s',str(item['success'])])
    else:
        rows += [['Patterned','Not measured','Not tested'],['Plain white','Not measured','Not tested'],['Glass or glossy','Not measured','Not tested']]
    story += [p('<b>Result.</b> '+('The observed trials are listed below.' if complete else 'No compatible-device surface trials have been completed.')),table(rows,[CW*.42,CW*.33,CW*.25]),Spacer(1,12),p('<b>Explanation.</b> The device matches camera feature points across frames and combines their motion with accelerometer and gyroscope measurements. Visual-inertial odometry estimates device motion; mapping supports surface estimation. Low texture, reflections, motion blur and poor lighting can weaken these estimates. Time begins when the source is ready; a 20-second timeout is logged as failure. [5]')]
    story += [PageBreak(),p('E5 Scale check','h1'),p('<b>Prediction.</b> A one-metre geometry should appear one metre tall, within the uncertainty of tracking and measurement.')]
    if complete:
        error=float(d['observed_height_cm'])-100
        story.append(p(f"<b>Result.</b> Against {escape(str(d['scale_reference']))}, the observed height was {d['observed_height_cm']} cm. Signed error = {error:+.2f} cm; absolute error = {abs(error):.2f} cm."))
    else:story.append(p('<b>Result.</b> Box3 measures 0.25 × 1.00 × 0.300000005 m and a base at y=0. Physical apparent height and height error remain unmeasured. The code dimensions cannot substitute for the required tape/reference-object test.'))
    story.append(p('<b>Explanation.</b> A biased surface or tracking estimate can change apparent placement. A reference ruler at a different depth, perspective or an imprecise reading can also distort the comparison. The reference should stand next to the product at the same depth.'))
    story += [p('E6 Retail implications and privacy','h1')]
    retail=('Observed failures: '+ '; '.join(escape(str(x)) for x in d['retailer_observations'])+'. ') if complete else 'Device-specific failure observations remain pending. Two risks to test are a delayed reticle, which could make a shopper abandon the preview, and return drift, which could undermine confidence in fit. A scan-progress prompt and a rescan option are candidate fixes. '
    retail_text=retail+'For a Kazakhstani retailer, fit claims should include measured uncertainty. With these requested features, the page can read device poses, hit poses and anchors. It does not automatically receive raw camera pixels, all feature points or a complete room mesh. Raw-camera access is a separate capability, not requested here. Explain why AR permission is needed and whether spatial data leaves the device. This page uploads neither camera images nor pose logs.'
    if len(re.findall(r'\S+',re.sub('<[^>]+>',' ',retail_text)))>150:raise ValueError('E6 exceeds 150 words; shorten the observed failures and fixes.')
    story.append(p(retail_text))
    story += [p('Development log','h1'),p('The first preview hid the light driver membranes behind the surround caps.<br/>Visual inspection and component depth comparison identified the overlap.<br/>The membrane depth was corrected and checked against bounds in commit e10f7e2.<br/>Simulated frame tests also cover replacement, Clear and delayed anchors.','small'),p('Sources','h1')]
    links=[('1','WebXR Device API','https://www.w3.org/TR/webxr/'),('2','WebXR Hit Test Module','https://immersive-web.github.io/hit-test/'),('3','WebXR Anchors Module','https://immersive-web.github.io/anchors/'),('4','Three.js 0.186.1 WebXRManager source','https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webxr/WebXRManager.js'),('5','Google ARCore fundamental concepts','https://developers.google.com/ar/develop/fundamentals')]
    for n,label,url in links:story.append(p(f'{n}. <link href="{url}" color="#4d4f44">{label}</link>','small'))
    if complete:
        story.append(PageBreak());story.append(p('Recorded device evidence','h1'))
        for key in image_keys:
            img=Image(str(ROOT/d['screenshots'][key]));img._restrictSize(CW,260)
            story.extend([p(key.replace('_',' ').title(),'h2'),img,Spacer(1,12)])
        for key in ('hit_local_matrix','hit_viewer_matrix'):story.append(p(key+': '+escape(str(d[key])),'small'))
    # Include tables and diagram labels, not only paragraphs, in the word budget.
    def flow_text(flow):
        if isinstance(flow,Paragraph):return flow.getPlainText()
        if isinstance(flow,Table):return ' '.join(flow_text(cell) for row in flow._cellvalues for cell in row)
        if isinstance(flow,MatrixFigure):return 'The pose matrix is stored column by column Xx nx Zx px Xy ny Zy py Xz nz Zz pz 0 0 0 1 Normal n elements 4 5 6 Position p elements 12 13 14 tilt acos ny length n Accept when tilt 12 degrees'
        return ''
    word_count=len(re.findall(r'\S+',' '.join(flow_text(flow) for flow in story)))
    if word_count>1200:raise ValueError(f'Write-up exceeds 1200 words: {word_count}')
    output=ROOT/('writeup.pdf' if complete else 'writeup_pre_device.pdf')
    build(output,story)
    print(json.dumps({'report':str(output),'words':word_count,'device_evidence_complete':complete}))

def inline(text):
    text=escape(text)
    text=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
    return re.sub(r'`(.+?)`',r'<font name="BodyBold">\1</font>',text)

def guide():
    lines=(ROOT/'DEFENSE_RU.md').read_text(encoding='utf-8').splitlines()
    story=[];i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                values=[x.strip() for x in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[-: ]+',v) for v in values):rows.append([inline(v) for v in values])
                i+=1
            story.extend([table(rows,[CW*.34,CW*.66]),Spacer(1,12)]);continue
        if line.startswith('# '):story.append(Paragraph(inline(line[2:]),styles['title']))
        elif line.startswith('## '):story.append(Paragraph(inline(line[3:]),styles['h1']))
        else:story.append(Paragraph(inline(line),styles['body']))
        i+=1
    path=ROOT/'defense_ru.pdf';build(path,story);print(json.dumps({'guide':str(path)}))

if __name__=='__main__':report();guide()
