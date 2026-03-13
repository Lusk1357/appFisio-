/* =====================================================
   exercicios_db.js
   Banco de dados central de exercícios e treinos.

   Como adicionar um exercício novo:
   1. Adicione uma entrada com o nome EXATO do exercício
      (igual ao que aparece no CATALOGO de exercicios_dia.js)
   2. Liste os treinos com nome e URL do embed do YouTube
      URL embed = https://www.youtube.com/embed/VIDEO_ID
      (substitua VIDEO_ID pelo código do vídeo)
   ===================================================== */

const EXERCICIOS_DB = {
	"Exercício 1 – Agachamento": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/dQw4w9WgXcQ"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/U3HlEF_E9fo"},
			{nome: "Treino C", video: "https://www.youtube.com/embed/YaXPRqUwItQ"},
			{nome: "Treino D", video: "https://www.youtube.com/embed/nEJ90plR3oY"},
		],
	},

	"Exercício 2 – Flexão de Joelho": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/1Tq3QdYUuHs"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/gv0BJNjRnhY"},
			{nome: "Treino C", video: "https://www.youtube.com/embed/VsLpXSEkZgk"},
		],
	},

	"Exercício 3 – Extensão de Quadril": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/ty6sSP5GCMU"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/F-YGeAMkBMk"},
		],
	},

	"Exercício 4 – Ponte Glútea": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/OUgsJ8-Vi0E"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/wPM8icPu6H8"},
			{nome: "Treino C", video: "https://www.youtube.com/embed/2GwxGMIRkVk"},
		],
	},

	"Exercício 5 – Abdução de Quadril": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/SNSiC6-CDRI"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/sT7b1WxnNoI"},
		],
	},

	"Exercício 6 – Rotação de Ombro": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/FKF5dBJ8ixw"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/2wlFBBDGQIg"},
		],
	},

	"Exercício 7 – Flexão Plantar": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/gwLzBJYoWlI"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/4YkOZt9lv18"},
		],
	},

	"Exercício 8 – Elevação Lateral": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/3VcKaXpzqRo"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/v_ZkxMbYAB0"},
		],
	},

	"Exercício 9 – Prancha": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/pSHjTRCQxIw"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/B296mZDhrP4"},
			{nome: "Treino C", video: "https://www.youtube.com/embed/kHPILQqCYHk"},
		],
	},

	"Exercício 10 – Alongamento Isquiotibial": {
		treinos: [
			{nome: "Treino A", video: "https://www.youtube.com/embed/AKsAHBEMx-k"},
			{nome: "Treino B", video: "https://www.youtube.com/embed/jyXmRWmPFzE"},
		],
	},
};
