import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('story_export', Path(__file__).resolve().parents[1] / 'tools/build-world-assets.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SpeakerSeparationTests(unittest.TestCase):
    def test_multiple_speakers_and_continuation(self):
        self.assertEqual(module.separate_speakers({'speaker':0,'text':'병사: 경고!\n기사: 내가 막겠다.\n어서 가라.'},{8:'병사',6:'기사'}),
                         [{'speaker':8,'text':'경고!'}, {'speaker':6,'text':'내가 막겠다.\n어서 가라.'}])
    def test_full_width_colon(self):
        self.assertEqual(module.separate_speakers({'speaker':0,'text':'兵士： 騎士殿！'},{8:'兵士'}),[{'speaker':8,'text':'騎士殿！'}])
    def test_prose_colon_is_preserved(self):
        line={'speaker':0,'text':'The stone revealed two knights: Mars and the guardian.'}
        self.assertEqual(module.separate_speakers(line,{6:'Knight'}),[line])
    def test_narration_and_dialogue_stay_in_order(self):
        self.assertEqual(module.separate_speakers({'speaker':0,'text':'The gate fell.\n Knight : Hold!'}, {6:'Knight'}),
                         [{'speaker':0,'text':'The gate fell.'},{'speaker':6,'text':'Hold!'}])
    def test_structured_dialogue_is_unchanged(self):
        line={'speaker':8,'text':'Sir!\nIt reached the gate!'}
        self.assertEqual(module.separate_speakers(line,{8:'Soldier'}),[line])

if __name__ == '__main__': unittest.main()
