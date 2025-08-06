# 영어 -> 한국어 번역 함수
from transformers import MarianMTModel, MarianTokenizer

class Translator:
    def __init__(self):
        model_name = "Helsinki-NLP/opus-mt-en-ko"
        self.tokenizer = MarianTokenizer.from_pretrained(model_name)
        self.model = MarianMTModel.from_pretrained(model_name)

    def translate_to_korean(self, text):
        inputs = self.tokenizer(text, return_tensors="pt", padding=True)
        translated = self.model.generate(**inputs)
        return self.tokenizer.decode(translated[0], skip_special_tokens=True)
