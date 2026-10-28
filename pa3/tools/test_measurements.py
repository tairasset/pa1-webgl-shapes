"""Synthetic fixtures only. These are never used as report measurements."""
import tempfile, unittest
from pathlib import Path
from validate_measurements import validate_measurements

class MeasurementValidationTests(unittest.TestCase):
    def setUp(self):
        self.test_parent=Path(__file__).resolve().parent
        self.temp=tempfile.TemporaryDirectory(prefix='.test-measurements-',dir=self.test_parent)
        self.root=Path(self.temp.name).resolve()
        # Existence checks are structural; authentic screenshot review is manual.
        (self.root/'test-only.png').write_bytes(b'test-only fixture')
        identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
        self.data={'student_id':'242458','device_model':'TEST FIXTURE','os_version':'TEST','browser_version':'TEST',
            'scale_reference':'TEST ruler','tracking_notes':'TEST observations','camera_start_local':{'x':0,'y':0,'z':0},
            'camera_after_1m_local':[0,0,-1],'hit_local_matrix':identity,'hit_viewer_matrix':identity.copy(),
            'placement_hit_matrix':identity.copy(),
            'drift_anchors_on_cm':0,'drift_anchors_off_cm':1,'observed_height_cm':100,
            'surface_trials':[{'surface':name,'success':True,'seconds':1} for name in ('patterned','white','glass')],
            'retailer_observations':['TEST failure and fix one','TEST failure and fix two'],
            'screenshots':{key:'test-only.png' for key in ('green','red','scale','drift_on','drift_off')}}
    def tearDown(self):
        assert self.root.is_relative_to(self.test_parent)
        self.temp.cleanup()
    def test_complete_shapes_accept_zero_drift(self): self.assertEqual(validate_measurements(self.data,self.root),[])
    def test_missing_evidence_is_rejected(self): self.assertGreater(len(validate_measurements({},self.root)),10)
    def test_blank_device_and_nan_measurement_are_rejected(self):
        self.data['device_model']=' ';self.data['drift_anchors_on_cm']=float('nan')
        errors=validate_measurements(self.data,self.root)
        self.assertTrue(any('device_model' in x for x in errors));self.assertTrue(any('drift_anchors_on_cm' in x for x in errors))
    def test_boolean_is_not_a_numeric_measurement(self):
        self.data['observed_height_cm']=True
        self.assertTrue(any('observed_height_cm' in x for x in validate_measurements(self.data,self.root)))
    def test_repeating_one_surface_does_not_count_as_three_surfaces(self):
        self.data['surface_trials']=[{'surface':'same surface','success':False}]*3
        self.assertTrue(any('distinct' in x for x in validate_measurements(self.data,self.root)))
    def test_invalid_or_zero_normal_matrix_is_rejected(self):
        self.data['hit_local_matrix']=[0]*16
        self.assertTrue(any('hit_local_matrix' in x for x in validate_measurements(self.data,self.root)))
    def test_outside_project_screenshot_is_rejected(self):
        self.data['screenshots']['green']='../outside.png'
        self.assertTrue(any('Screenshot green' in x for x in validate_measurements(self.data,self.root)))
    def test_e1_hit_does_not_replace_e3_placement_evidence(self):
        self.data.pop('placement_hit_matrix')
        self.assertTrue(any('placement_hit_matrix' in x for x in validate_measurements(self.data,self.root)))
    def test_success_without_latency_is_rejected_but_timeout_can_have_no_hit_time(self):
        self.data['surface_trials'][0].pop('seconds')
        self.assertTrue(any('successful trial' in x for x in validate_measurements(self.data,self.root)))
        self.data['surface_trials'][0]['success']=False
        self.assertEqual(validate_measurements(self.data,self.root),[])

if __name__=='__main__': unittest.main()
