"""Check evidence completeness and types; this cannot authenticate field observations."""
from pathlib import Path
import json, math, sys

def finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

def validate_measurements(data, root):
    errors=[]
    if not isinstance(data, dict): return ['Measurements must be a JSON object.']
    if data.get('student_id') != '242458': errors.append('student_id must be 242458.')
    for key in ('device_model','os_version','browser_version','scale_reference','tracking_notes'):
        if not isinstance(data.get(key),str) or not data[key].strip(): errors.append(f'{key} needs a real nonempty observation.')
    for key in ('camera_start_local','camera_after_1m_local'):
        value=data.get(key)
        values=[value.get(k) for k in ('x','y','z')] if isinstance(value,dict) else value
        if not isinstance(values,list) or len(values)!=3 or not all(finite_number(x) for x in values): errors.append(f'{key} needs three finite coordinates.')
    for key in ('hit_viewer_matrix','hit_local_matrix'):
        value=data.get(key)
        if not isinstance(value,list) or len(value)!=16 or not all(finite_number(x) for x in value):
            errors.append(f'{key} needs 16 finite values.'); continue
        if any(abs(value[i])>1e-4 for i in (3,7,11)) or abs(value[15]-1)>1e-4 or math.hypot(*value[4:7])<1e-6:
            errors.append(f'{key} is not a usable affine pose matrix.')
    for key in ('drift_anchors_on_cm','drift_anchors_off_cm'):
        if not finite_number(data.get(key)) or data[key]<0: errors.append(f'{key} needs a finite nonnegative measurement.')
    if not finite_number(data.get('observed_height_cm')) or data['observed_height_cm']<=0: errors.append('observed_height_cm needs a positive measurement.')
    trials=data.get('surface_trials')
    names=set()
    if not isinstance(trials,list): trials=[]
    for trial in trials:
        if not isinstance(trial,dict): errors.append('Each surface trial must be an object.'); continue
        name=trial.get('surface')
        if not isinstance(name,str) or not name.strip(): errors.append('Every surface trial needs its surface name.')
        else: names.add(name.strip().casefold())
        if not isinstance(trial.get('success'),bool): errors.append('Every surface trial needs success true or false.')
        if trial.get('success') is True and (not finite_number(trial.get('seconds')) or not 0<=trial['seconds']<=20): errors.append('A successful trial needs measured seconds between 0 and 20.')
    if len(names)<3: errors.append('At least three distinct tested surfaces are required.')
    observations=data.get('retailer_observations')
    if not isinstance(observations,list) or len(observations)!=2 or any(not isinstance(x,str) or not x.strip() for x in observations): errors.append('Two observed retailer failure descriptions with fixes are required.')
    images=data.get('screenshots') or {}
    if not isinstance(images,dict): images={}
    for key in ('green','red','scale','drift_on','drift_off'):
        value=images.get(key)
        path=(Path(root)/value).resolve() if isinstance(value,str) and value.strip() else None
        if not path or not path.is_relative_to(Path(root).resolve()) or not path.is_file() or path.suffix.lower() not in ('.png','.jpg','.jpeg'):
            errors.append(f'Screenshot {key} must be an existing PNG/JPEG inside this project.')
    return errors

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    data=json.loads((root/'measurements.json').read_text(encoding='utf-8-sig'))
    errors=validate_measurements(data,root)
    if errors:
        print('Field evidence is incomplete:')
        print('\n'.join('- '+x for x in errors))
        sys.exit(1)
    print('Evidence fields are structurally complete; verify authenticity and report content manually.')
