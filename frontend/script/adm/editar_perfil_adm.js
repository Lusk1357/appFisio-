document.addEventListener("DOMContentLoaded", () => {
	const photoUploadBtn = document.getElementById("photoUploadBtn");
	const fileInput = document.getElementById("fileInput");
	const profilePreview = document.getElementById("profilePreview");

	photoUploadBtn.addEventListener("click", () => {
		fileInput.click();
	});

	fileInput.addEventListener("change", function () {
		const file = this.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (e) {
				profilePreview.src = e.target.result;
				profilePreview.style.display = "block";
			};
			reader.readAsDataURL(file);
		}
	});

	const unitToggles = document.querySelectorAll(".unit-toggle");

	unitToggles.forEach((toggle) => {
		const btns = toggle.querySelectorAll(".unit-btn");

		btns.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				btns.forEach((b) => b.classList.remove("active"));

				e.target.classList.add("active");
			});
		});
	});

	const genderSelect = document.getElementById("genderSelect");
	const genderIcon = document.getElementById("genderIcon");

	genderSelect.addEventListener("change", (e) => {
		const value = e.target.value;

		genderIcon.className = "fa-solid icon-left";

		if (value === "male") {
			genderIcon.classList.add("fa-mars");
		} else if (value === "female") {
			genderIcon.classList.add("fa-venus");
		} else {
			genderIcon.classList.add("fa-genderless");
		}
	});

	const form = document.getElementById("editProfileForm");
	const saveBtn = document.getElementById("saveBtn");

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const originalText = saveBtn.innerHTML;
		saveBtn.innerHTML =
			'<i class="fa-solid fa-circle-notch fa-spin"></i> SALVANDO...';
		saveBtn.style.backgroundColor = "#1c75a6";

		setTimeout(() => {
			saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> SALVO!';
			saveBtn.style.backgroundColor = "#10b981";

			setTimeout(() => {
				saveBtn.innerHTML = originalText;
				saveBtn.style.backgroundColor = "";
			}, 2000);
		}, 1500);
	});
});
