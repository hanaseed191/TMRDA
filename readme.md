<!-- Design System -->
<!DOCTYPE html>

<html lang="th"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>ลงทะเบียน TMRDA - ระบบบริหารจัดการการฝึกอบรม</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-surface": "#0b1c30",
                        "inverse-on-surface": "#eaf1ff",
                        "on-background": "#0b1c30",
                        "on-primary-fixed": "#410002",
                        "error": "#ba1a1a",
                        "on-tertiary-fixed": "#191c1e",
                        "on-primary-fixed-variant": "#93000b",
                        "inverse-surface": "#213145",
                        "on-surface-variant": "#5c403c",
                        "error-container": "#ffdad6",
                        "background": "#f8f9ff",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-low": "#eff4ff",
                        "secondary-fixed": "#d8e3fb",
                        "surface-tint": "#bf0715",
                        "on-secondary-fixed-variant": "#3c475a",
                        "on-tertiary": "#ffffff",
                        "secondary-fixed-dim": "#bcc7de",
                        "surface-variant": "#d3e4fe",
                        "tertiary-container": "#6f7274",
                        "tertiary-fixed-dim": "#c4c7c9",
                        "surface-container-highest": "#d3e4fe",
                        "primary": "#b70011",
                        "outline-variant": "#e6bdb8",
                        "tertiary-fixed": "#e0e3e5",
                        "surface-dim": "#cbdbf5",
                        "primary-container": "#dc2626",
                        "surface-container": "#e5eeff",
                        "on-primary-container": "#fff6f5",
                        "on-secondary": "#ffffff",
                        "surface-bright": "#f8f9ff",
                        "tertiary": "#565a5b",
                        "secondary": "#545f73",
                        "inverse-primary": "#ffb4ab",
                        "on-tertiary-container": "#f6f8fa",
                        "surface-container-high": "#dce9ff",
                        "on-error": "#ffffff",
                        "secondary-container": "#d5e0f8",
                        "on-secondary-container": "#586377",
                        "primary-fixed": "#ffdad6",
                        "surface": "#f8f9ff",
                        "primary-fixed-dim": "#ffb4ab",
                        "on-primary": "#ffffff",
                        "outline": "#916f6b",
                        "on-error-container": "#93000a",
                        "on-tertiary-fixed-variant": "#444749",
                        "on-secondary-fixed": "#111c2d"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "spacing": {
                        "section-gap": "2.5rem",
                        "stack-sm": "0.5rem",
                        "stack-md": "1rem",
                        "margin-mobile": "1rem",
                        "gutter": "1.5rem",
                        "container-max": "1280px"
                    },
                    "fontFamily": {
                        "headline-sm": ["IBM Plex Sans Thai"],
                        "display-lg": ["IBM Plex Sans Thai"],
                        "headline-md": ["IBM Plex Sans Thai"],
                        "body-lg": ["IBM Plex Sans Thai"],
                        "label-sm": ["IBM Plex Sans Thai"],
                        "body-md": ["IBM Plex Sans Thai"],
                        "label-md": ["IBM Plex Sans Thai"]
                    },
                    "fontSize": {
                        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                        "display-lg": ["36px", {"lineHeight": "44px", "fontWeight": "700"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                        "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "500"}]
                    }
                },
            },
        }
    </script>
<style>
        body {
            font-family: 'IBM Plex Sans Thai', sans-serif;
            background-color: #f8f9ff;
            color: #0b1c30;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .step-active {
            background-color: #b70011;
            color: white;
            box-shadow: 0 0 0 4px rgba(183, 0, 17, 0.1);
        }
        .step-complete {
            background-color: #0b1c30;
            color: white;
        }
        .step-inactive {
            background-color: #e2e8f0;
            color: #64748b;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #b70011 !important;
            box-shadow: 0 0 0 2px rgba(183, 0, 17, 0.1);
        }
    </style>
</head>
<body class="min-h-screen">
<!-- TopAppBar -->
<header class="flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50 bg-surface border-b border-outline-variant shadow-sm">
<div class="flex items-center gap-2">
<span class="text-headline-md font-headline-md font-bold text-primary">TMRDA</span>
</div>
<div class="flex items-center gap-4">
<button class="bg-primary text-white px-4 py-1.5 rounded-lg text-label-md font-bold hover:bg-primary-container transition-all">
                หน้าแรก
            </button>
<button class="text-on-surface-variant p-2 hover:bg-surface-container-low rounded-full transition-colors">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</header>
<main class="pt-24 pb-12 px-gutter">
<div class="max-w-[800px] mx-auto">
<!-- Header Title -->
<div class="text-center mb-10">
<h1 class="text-display-lg font-display-lg text-on-surface mb-2">ลงทะเบียน</h1>
<p class="text-body-md text-on-surface-variant">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้งานระบบ TMRDA</p>
</div>
<!-- Stepper Container -->
<div class="relative flex justify-between mb-12">
<!-- Progress Line -->
<div class="absolute top-5 left-0 w-full h-[2px] bg-slate-200 -z-10">
<div class="h-full bg-primary transition-all duration-500" id="progress-bar" style="width: 0%"></div>
</div>
<!-- Step 1 -->
<div class="flex flex-col items-center gap-2">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold step-active transition-all duration-300" id="step-circle-1">1</div>
<span class="text-label-sm font-label-sm text-on-surface">ข้อมูลทั่วไป</span>
</div>
<!-- Step 2 -->
<div class="flex flex-col items-center gap-2">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold step-inactive transition-all duration-300" id="step-circle-2">2</div>
<span class="text-label-sm font-label-sm text-on-surface-variant">ติดต่อ</span>
</div>
<!-- Step 3 -->
<div class="flex flex-col items-center gap-2">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold step-inactive transition-all duration-300" id="step-circle-3">3</div>
<span class="text-label-sm font-label-sm text-on-surface-variant">ที่อยู่</span>
</div>
<!-- Step 4 -->
<div class="flex flex-col items-center gap-2">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold step-inactive transition-all duration-300" id="step-circle-4">4</div>
<span class="text-label-sm font-label-sm text-on-surface-variant">การศึกษา</span>
</div>
</div>
<!-- Form Content -->
<div class="bg-white border border-outline-variant p-8 rounded-xl shadow-sm">
<!-- Section 1: General Info -->
<section class="space-y-6" id="section-1">
<div class="grid grid-cols-1 md:grid-cols-12 gap-6">
<div class="md:col-span-4">
<label class="block text-label-md font-label-md text-on-surface mb-2">คำนำหน้า (TH) <span class="text-primary">*</span></label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md focus:border-primary transition-all">
<option>นาย</option>
<option>นาง</option>
<option>นางสาว</option>
</select>
</div>
<div class="md:col-span-8">
<label class="block text-label-md font-label-md text-on-surface mb-2">ชื่อ-นามสกุล (TH) <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md transition-all" placeholder="ชื่อ นามสกุล ภาษาไทย" type="text"/>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-12 gap-6">
<div class="md:col-span-4">
<label class="block text-label-md font-label-md text-on-surface mb-2">Title (EN) <span class="text-primary">*</span></label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md transition-all">
<option>Mr.</option>
<option>Mrs.</option>
<option>Ms.</option>
</select>
</div>
<div class="md:col-span-8">
<label class="block text-label-md font-label-md text-on-surface mb-2">Name-Surname (EN) <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md transition-all" placeholder="First Name Last Name" type="text"/>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">เลขบัตรประชาชน <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md transition-all" placeholder="1749900112233" type="text"/>
</div>
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">สัญชาติ <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md transition-all" type="text" value="ไทย"/>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">วัน/เดือน/ปี เกิด <span class="text-primary">*</span></label>
<div class="relative">
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md pr-10 transition-all" type="date"/>
</div>
</div>
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">สภาพร่างกาย <span class="text-primary">*</span></label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md transition-all">
<option>ปกติ</option>
<option>ผู้พิการ</option>
</select>
</div>
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">เพศ <span class="text-primary">*</span></label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md transition-all">
<option>ชาย</option>
<option>หญิง</option>
<option>อื่นๆ</option>
</select>
</div>
</div>
</section>
<!-- Section 2: Contact (Hidden) -->
<section class="hidden space-y-6" id="section-2">
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">เบอร์โทรศัพท์ติดต่อ <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md transition-all bg-secondary-container/20" placeholder="06XXXXXXXX" type="tel"/>
</div>
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">อีเมล <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md transition-all" placeholder="example@email.com" type="email"/>
</div>
</section>
<!-- Section 3: Address (Hidden) -->
<section class="hidden space-y-6" id="section-3">
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<div class="col-span-1">
<label class="block text-label-md font-label-md text-on-surface mb-2">บ้านเลขที่ <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md" type="text"/>
</div>
<div class="col-span-1">
<label class="block text-label-md font-label-md text-on-surface mb-2">หมู่ที่</label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md" type="text"/>
</div>
<div class="col-span-1 md:col-span-1">
<label class="block text-label-md font-label-md text-on-surface mb-2">ถนน</label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md" type="text"/>
</div>
<div class="col-span-1 md:col-span-1">
<label class="block text-label-md font-label-md text-on-surface mb-2">ซอย</label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md" type="text"/>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">จังหวัด</label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md">
<option>กรุงเทพมหานคร</option>
</select>
</div>
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">เขต/อำเภอ</label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md">
<option>ดุสิต</option>
</select>
</div>
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">แขวง/ตำบล</label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md">
<option>ดุสิต</option>
</select>
</div>
</div>
<div class="md:w-1/3">
<label class="block text-label-md font-label-md text-on-surface mb-2">รหัสไปรษณีย์</label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md" type="text" value="10300"/>
</div>
</section>
<!-- Section 4: Education (Hidden) -->
<section class="hidden space-y-6" id="section-4">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">วุฒิการศึกษาสูงสุด <span class="text-primary">*</span></label>
<select class="w-full h-12 border border-slate-300 rounded-lg bg-white px-4 text-body-md">
<option>ประถมศึกษา</option>
<option>มัธยมศึกษาตอนต้น</option>
<option>มัธยมศึกษาตอนปลาย / ปวช.</option>
<option>อนุปริญญา / ปวส.</option>
<option selected="">ปริญญาตรี</option>
<option>ปริญญาโท</option>
<option>ปริญญาเอก</option>
</select>
</div>
<div>
<label class="block text-label-md font-label-md text-on-surface mb-2">สาขา/วิชาเอก <span class="text-primary">*</span></label>
<input class="w-full h-12 border border-slate-300 rounded-lg px-4 text-body-md" placeholder="เช่น เทคโนโลยีสารสนเทศ" type="text"/>
</div>
</div>
<div class="p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2">
<span class="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
<p class="text-body-md text-slate-600">แนบไฟล์สำเนาวุฒิการศึกษา (.pdf, .jpg)</p>
<button class="text-primary font-bold text-label-md hover:underline">เลือกไฟล์</button>
</div>
</section>
<!-- Navigation Buttons -->
<div class="flex gap-4 mt-10">
<button class="hidden flex-1 h-12 border border-slate-300 rounded-lg text-body-md font-bold text-on-surface hover:bg-slate-50 transition-all" id="btn-prev">
                        ย้อนกลับ
                    </button>
<button class="flex-1 h-12 bg-primary text-white rounded-lg text-body-md font-bold hover:bg-primary-container transition-all shadow-md active:scale-95" id="btn-next">
                        ถัดไป
                    </button>
</div>
</div>
<!-- Side Image/Decorative (Bento Style) -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
<div class="bg-primary-container rounded-xl p-6 flex flex-col justify-center text-white">
<h3 class="font-headline-sm text-headline-sm mb-2">ความปลอดภัยสูงสุด</h3>
<p class="text-label-md opacity-90">ข้อมูลของคุณจะถูกเก็บรักษาภายใต้มาตรการรักษาความปลอดภัยระดับสากล</p>
</div>
<div class="col-span-2 relative h-48 rounded-xl overflow-hidden group">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" data-alt="A futuristic and professional high-tech workspace background with subtle red lighting accents, showcasing a clean digital interface on a sleek laptop screen. The environment is minimalist with deep navy and crisp white tones, symbolizing a modern and secure administrative training platform. High-key lighting creates a professional and trustworthy corporate atmosphere." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuABld-Uf9xeIoOtiY9TTxUVfgDtCRGjWizbiIoBvxnu6CUSMpX8uZZJweaQmCso0rC2JmJhV9eo7mJI7-Ox2k1oGBP8hIS8URFn7CkKHRzlBE8w9OvuSucBrjoPL0YWZ_RUnjV40f4rc2FlGkMb8ClrhSZhaqjT4UKZFuQR9udUyRIOc_UAzUBSSlmm9aLVfU6-WAzwNDGFrre-mhCuAfqyJ3aGduANRHlqT0y_1JoME1f2rQouJRkc')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent flex items-end p-6">
<p class="text-white text-body-md font-medium">เข้าร่วมกับระบบฝึกอบรมที่ทันสมัยที่สุด</p>
</div>
</div>
</div>
</div>
</main>
<!-- Footer -->
<footer class="bg-white border-t border-outline-variant py-8 px-gutter mt-12">
<div class="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
<div class="flex flex-col gap-1">
<span class="text-headline-sm font-bold text-primary">TMRDA</span>
<p class="text-label-sm text-on-surface-variant">© 2024 ระบบบริหารจัดการการฝึกอบรม (Training Management &amp; Registration Data Administration)</p>
</div>
<div class="flex gap-6 text-label-md text-on-surface-variant">
<a class="hover:text-primary transition-colors" href="#">นโยบายความเป็นส่วนตัว</a>
<a class="hover:text-primary transition-colors" href="#">ติดต่อสอบถาม</a>
<a class="hover:text-primary transition-colors" href="#">คู่มือการใช้งาน</a>
</div>
</div>
</footer>
<script>
        let currentStep = 1;
        const totalSteps = 4;

        const btnNext = document.getElementById('btn-next');
        const btnPrev = document.getElementById('btn-prev');
        const progressBar = document.getElementById('progress-bar');

        function updateStepUI() {
            // Hide all sections
            for(let i = 1; i <= totalSteps; i++) {
                document.getElementById(`section-${i}`).classList.add('hidden');
                const circle = document.getElementById(`step-circle-${i}`);
                if(i < currentStep) {
                    circle.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold step-complete transition-all duration-300';
                    circle.innerHTML = '<span class="material-symbols-outlined text-base">check</span>';
                } else if(i === currentStep) {
                    circle.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold step-active transition-all duration-300';
                    circle.innerText = i;
                } else {
                    circle.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold step-inactive transition-all duration-300';
                    circle.innerText = i;
                }
            }

            // Show current section
            document.getElementById(`section-${currentStep}`).classList.remove('hidden');

            // Update Progress Bar
            progressBar.style.width = `${((currentStep - 1) / (totalSteps - 1)) * 100}%`;

            // Update buttons
            if(currentStep === 1) {
                btnPrev.classList.add('hidden');
                btnNext.innerText = 'ถัดไป';
            } else if(currentStep === totalSteps) {
                btnPrev.classList.remove('hidden');
                btnNext.innerText = 'ลงทะเบียน';
            } else {
                btnPrev.classList.remove('hidden');
                btnNext.innerText = 'ถัดไป';
            }
        }

        btnNext.addEventListener('click', () => {
            if(currentStep < totalSteps) {
                currentStep++;
                updateStepUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('ส่งข้อมูลลงทะเบียนเรียบร้อยแล้ว');
            }
        });

        btnPrev.addEventListener('click', () => {
            if(currentStep > 1) {
                currentStep--;
                updateStepUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Initialize UI
        updateStepUI();
    </script>
</body></html>

<!-- ระบบสมัครสมาชิก - TMRDA -->
<!DOCTYPE html>

<html lang="th"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>TMRDA - Assessment Builder</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-surface": "#0b1c30",
                    "inverse-on-surface": "#eaf1ff",
                    "on-background": "#0b1c30",
                    "on-primary-fixed": "#410002",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed": "#191c1e",
                    "on-primary-fixed-variant": "#93000b",
                    "inverse-surface": "#213145",
                    "on-surface-variant": "#5c403c",
                    "error-container": "#ffdad6",
                    "background": "#f8f9ff",
                    "surface-container-lowest": "#ffffff",
                    "surface-container-low": "#eff4ff",
                    "secondary-fixed": "#d8e3fb",
                    "surface-tint": "#bf0715",
                    "on-secondary-fixed-variant": "#3c475a",
                    "on-tertiary": "#ffffff",
                    "secondary-fixed-dim": "#bcc7de",
                    "surface-variant": "#d3e4fe",
                    "tertiary-container": "#6f7274",
                    "tertiary-fixed-dim": "#c4c7c9",
                    "surface-container-highest": "#d3e4fe",
                    "primary": "#b70011",
                    "outline-variant": "#e6bdb8",
                    "tertiary-fixed": "#e0e3e5",
                    "surface-dim": "#cbdbf5",
                    "primary-container": "#dc2626",
                    "surface-container": "#e5eeff",
                    "on-primary-container": "#fff6f5",
                    "on-secondary": "#ffffff",
                    "surface-bright": "#f8f9ff",
                    "tertiary": "#565a5b",
                    "secondary": "#545f73",
                    "inverse-primary": "#ffb4ab",
                    "on-tertiary-container": "#f6f8fa",
                    "surface-container-high": "#dce9ff",
                    "on-error": "#ffffff",
                    "secondary-container": "#d5e0f8",
                    "on-secondary-container": "#586377",
                    "primary-fixed": "#ffdad6",
                    "surface": "#f8f9ff",
                    "primary-fixed-dim": "#ffb4ab",
                    "on-primary": "#ffffff",
                    "outline": "#916f6b",
                    "on-error-container": "#93000a",
                    "on-tertiary-fixed-variant": "#444749",
                    "on-secondary-fixed": "#111c2d"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "section-gap": "2.5rem",
                    "stack-sm": "0.5rem",
                    "stack-md": "1rem",
                    "margin-mobile": "1rem",
                    "gutter": "1.5rem",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "headline-sm": ["IBM Plex Sans Thai"],
                    "display-lg": ["IBM Plex Sans Thai"],
                    "headline-md": ["IBM Plex Sans Thai"],
                    "body-lg": ["IBM Plex Sans Thai"],
                    "label-sm": ["IBM Plex Sans Thai"],
                    "body-md": ["IBM Plex Sans Thai"],
                    "label-md": ["IBM Plex Sans Thai"]
            },
            "fontSize": {
                    "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "display-lg": ["36px", {"lineHeight": "44px", "fontWeight": "700"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "500"}]
            }
          },
        },
      }
    </script>
<style>
        body { font-family: 'IBM Plex Sans Thai', sans-serif; background-color: #f8f9ff; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .active-tab { position: relative; }
        .active-tab::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background-color: #b70011; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(226, 232, 240, 0.5); }
    </style>
</head>
<body class="text-on-surface">
<!-- TopAppBar -->
<header class="flex justify-between items-center px-gutter h-16 w-full fixed top-0 z-50 bg-surface border-b border-outline-variant">
<div class="flex items-center gap-4">
<span class="text-headline-md font-headline-md font-bold text-primary">TMRDA</span>
<div class="h-6 w-px bg-outline-variant mx-2"></div>
<span class="font-label-md text-label-md text-on-surface-variant">ระบบบริหารจัดการการฝึกอบรม</span>
</div>
<div class="flex items-center gap-4">
<button class="p-2 hover:bg-surface-container-low transition-colors rounded-full">
<span class="material-symbols-outlined text-on-surface-variant">notifications</span>
</button>
<button class="p-2 hover:bg-surface-container-low transition-colors rounded-full">
<span class="material-symbols-outlined text-on-surface-variant">settings</span>
</button>
<div class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
                AD
            </div>
</div>
</header>
<!-- SideNavBar -->
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col py-4 px-3 overflow-y-auto bg-surface-container-low border-r border-outline-variant z-40 hidden md:flex">
<div class="mb-6 px-3">
<div class="flex items-center gap-3 mb-4">
<div class="w-10 h-10 rounded bg-primary flex items-center justify-center text-white">
<span class="material-symbols-outlined">security</span>
</div>
<div>
<h2 class="font-headline-sm text-headline-sm text-primary leading-tight">TMRDA Admin</h2>
<p class="font-label-sm text-label-sm text-on-surface-variant">ผู้ดูแลระบบ</p>
</div>
</div>
<button class="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-label-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
<span class="material-symbols-outlined text-lg">add</span>
                สร้างคอร์สใหม่
            </button>
</div>
<nav class="flex-1 space-y-1">
<a class="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group" href="#">
<span class="material-symbols-outlined group-hover:text-primary">home</span>
<span class="font-label-md text-label-md">หน้าแรก</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 bg-primary-container text-on-primary-container rounded-lg font-bold transition-all group translate-x-1" href="#">
<span class="material-symbols-outlined">menu_book</span>
<span class="font-label-md text-label-md">การจัดการคอร์ส</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group" href="#">
<span class="material-symbols-outlined group-hover:text-primary">group</span>
<span class="font-label-md text-label-md">สมาชิก</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group" href="#">
<span class="material-symbols-outlined group-hover:text-primary">edit_note</span>
<span class="font-label-md text-label-md">การประเมิน</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all group" href="#">
<span class="material-symbols-outlined group-hover:text-primary">assignment_turned_in</span>
<span class="font-label-md text-label-md">ผลการทดสอบ</span>
</a>
</nav>
<div class="pt-4 mt-4 border-t border-outline-variant space-y-1">
<a class="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md text-label-md">ตั้งค่า</span>
</a>
<a class="flex items-center gap-3 px-3 py-2.5 text-error hover:bg-error-container/20 rounded-lg transition-all" href="#">
<span class="material-symbols-outlined">logout</span>
<span class="font-label-md text-label-md">ออกจากระบบ</span>
</a>
</div>
</aside>
<!-- Main Content -->
<main class="md:ml-64 pt-20 pb-12 px- gutter">
<div class="max-w-container-max mx-auto px-gutter">
<!-- Breadcrumbs -->
<nav class="flex mb-6 items-center gap-2 text-on-surface-variant">
<span class="font-label-md text-label-md">การจัดการคอร์ส</span>
<span class="material-symbols-outlined text-sm">chevron_right</span>
<span class="font-label-md text-label-md">หลักสูตรเทคโนโลยีสารสนเทศ</span>
<span class="material-symbols-outlined text-sm">chevron_right</span>
<span class="font-label-md text-label-md text-primary font-bold">สร้างชุดประเมินและข้อสอบ</span>
</nav>
<!-- Header Section -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
<div>
<h1 class="font-display-lg text-display-lg text-on-surface mb-2">สร้างชุดประเมินและข้อสอบ</h1>
<p class="font-body-md text-body-md text-on-surface-variant">กำหนดหัวข้อ รายละเอียด และเกณฑ์การให้คะแนนสำหรับชุดประเมินผลการอบรม</p>
</div>
<div class="flex gap-3">
<button class="px-6 py-2.5 border border-outline text-on-surface-variant rounded-lg font-label-md hover:bg-surface-container transition-all">
                        ยกเลิก
                    </button>
<button class="px-8 py-2.5 bg-primary text-white rounded-lg font-label-md hover:opacity-90 shadow-sm transition-all flex items-center gap-2">
<span class="material-symbols-outlined text-lg">save</span>
                        บันทึกชุดประเมิน
                    </button>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
<!-- Left Column: Builder -->
<div class="lg:col-span-8 space-y-6">
<!-- Stepper -->
<div class="bg-white rounded-xl border border-outline-variant p-6 shadow-sm flex justify-between items-center overflow-x-auto">
<div class="flex items-center gap-3 shrink-0">
<div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
<span class="font-label-md text-label-md font-bold text-on-surface">ข้อมูลพื้นฐาน</span>
</div>
<div class="h-px bg-outline-variant flex-1 mx-4 min-w-[20px]"></div>
<div class="flex items-center gap-3 shrink-0">
<div class="w-8 h-8 rounded-full border-2 border-outline-variant text-on-surface-variant flex items-center justify-center font-bold text-sm">2</div>
<span class="font-label-md text-label-md text-on-surface-variant">รายละเอียดข้อสอบ</span>
</div>
<div class="h-px bg-outline-variant flex-1 mx-4 min-w-[20px]"></div>
<div class="flex items-center gap-3 shrink-0">
<div class="w-8 h-8 rounded-full border-2 border-outline-variant text-on-surface-variant flex items-center justify-center font-bold text-sm">3</div>
<span class="font-label-md text-label-md text-on-surface-variant">เกณฑ์การให้คะแนน</span>
</div>
</div>
<!-- Question Block #1 -->
<div class="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden transition-all border-l-4 border-l-primary">
<div class="bg-surface-container-low px-6 py-3 flex justify-between items-center border-b border-outline-variant">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-on-surface-variant cursor-move">drag_indicator</span>
<span class="font-headline-sm text-headline-sm text-on-surface">ชุดที่ 1: การประเมินพื้นฐาน</span>
</div>
<div class="flex gap-2">
<button class="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant">
<span class="material-symbols-outlined text-lg">content_copy</span>
</button>
<button class="p-1.5 hover:bg-error-container/20 rounded-lg text-error">
<span class="material-symbols-outlined text-lg">delete</span>
</button>
</div>
</div>
<div class="p-6 space-y-6">
<!-- Title Input -->
<div>
<label class="block font-label-md text-label-md text-on-surface-variant mb-2">หัวข้อชุดประเมิน</label>
<input class="w-full px-4 py-2.5 rounded-lg border border-outline bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" type="text" value="ความรู้ความเข้าใจเบื้องต้นเกี่ยวกับระบบสารสนเทศ"/>
</div>
<!-- Rich Text Editor Mock -->
<div>
<label class="block font-label-md text-label-md text-on-surface-variant mb-2">รายละเอียดและคำชี้แจง</label>
<div class="border border-outline rounded-lg overflow-hidden focus-within:border-primary transition-all">
<div class="bg-surface-container-low px-4 py-2 border-b border-outline-variant flex items-center gap-1 overflow-x-auto">
<button class="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span class="material-symbols-outlined text-lg">format_bold</span></button>
<button class="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span class="material-symbols-outlined text-lg">format_italic</span></button>
<button class="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span class="material-symbols-outlined text-lg">format_underlined</span></button>
<div class="w-px h-6 bg-outline-variant mx-1"></div>
<button class="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span class="material-symbols-outlined text-lg">format_list_bulleted</span></button>
<button class="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span class="material-symbols-outlined text-lg">format_list_numbered</span></button>
<div class="w-px h-6 bg-outline-variant mx-1"></div>
<button class="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span class="material-symbols-outlined text-lg">link</span></button>
<button class="p-1.5 hover:bg-white rounded hover:shadow-sm transition-all"><span class="material-symbols-outlined text-lg">image</span></button>
</div>
<textarea class="w-full px-4 py-3 border-none focus:ring-0 resize-none font-body-md text-body-md" placeholder="ใส่คำชี้แจงสำหรับส่วนนี้..." rows="4">ผู้เข้าอบรมต้องตอบคำถามทั้งหมด 10 ข้อ โดยพิจารณาตามหัวข้อการทดสอบดังนี้...</textarea>
</div>
</div>
<!-- Sub-points / Nested Questions -->
<div class="bg-surface-container-lowest border border-dashed border-outline rounded-lg p-4 space-y-4">
<div class="flex justify-between items-center mb-2">
<h4 class="font-label-md text-label-md text-on-surface font-bold">หัวข้อย่อยและเกณฑ์คะแนน (รวม 10 คะแนน)</h4>
<span class="text-xs text-on-surface-variant italic">คลิกเพื่อขยายดูรายละเอียด</span>
</div>
<div class="space-y-3">
<div class="flex items-center gap-4 bg-white p-3 rounded border border-outline-variant group">
<span class="text-xs font-bold text-on-surface-variant">1.1</span>
<input class="flex-1 bg-transparent border-none focus:ring-0 p-0 font-body-md" type="text" value="นิยามและโครงสร้างของฐานข้อมูล"/>
<div class="flex items-center gap-2">
<input class="w-16 px-2 py-1 text-center border border-outline rounded text-sm focus:border-primary" type="number" value="5"/>
<span class="text-xs text-on-surface-variant">คะแนน</span>
</div>
<button class="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all">
<span class="material-symbols-outlined text-sm">close</span>
</button>
</div>
<div class="flex items-center gap-4 bg-white p-3 rounded border border-outline-variant group">
<span class="text-xs font-bold text-on-surface-variant">1.2</span>
<input class="flex-1 bg-transparent border-none focus:ring-0 p-0 font-body-md" type="text" value="ความปลอดภัยของข้อมูลเบื้องต้น"/>
<div class="flex items-center gap-2">
<input class="w-16 px-2 py-1 text-center border border-outline rounded text-sm focus:border-primary" type="number" value="5"/>
<span class="text-xs text-on-surface-variant">คะแนน</span>
</div>
<button class="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all">
<span class="material-symbols-outlined text-sm">close</span>
</button>
</div>
</div>
<button class="w-full py-2 flex items-center justify-center gap-2 text-primary font-label-md hover:bg-primary-container/5 rounded-lg border border-dashed border-primary transition-all">
<span class="material-symbols-outlined text-sm">add</span>
                                    เพิ่มหัวข้อย่อย
                                </button>
</div>
</div>
</div>
<!-- Add New Section CTA -->
<button class="w-full py-8 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-all group">
<span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_circle</span>
<span class="font-headline-sm">เพิ่มชุดประเมินถัดไป</span>
</button>
</div>
<!-- Right Column: Summary & Preview -->
<div class="lg:col-span-4">
<div class="sticky top-24 space-y-6">
<!-- Total Score Card -->
<div class="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-md border border-primary/20 overflow-hidden relative">
<div class="absolute top-0 right-0 p-2 opacity-20">
<span class="material-symbols-outlined text-6xl">analytics</span>
</div>
<h3 class="font-label-md text-label-md uppercase tracking-wider mb-4 font-bold opacity-80">สรุปคะแนนรวมทั้งหมด</h3>
<div class="flex items-end gap-2 mb-6">
<span class="text-5xl font-bold">100</span>
<span class="text-lg font-bold mb-1 opacity-80">คะแนนเต็ม</span>
</div>
<div class="space-y-3">
<div class="flex justify-between items-center text-sm">
<span>ภาคความรู้</span>
<span class="font-bold">40 คะแนน</span>
</div>
<div class="w-full h-1.5 bg-white/20 rounded-full">
<div class="h-full bg-white w-[40%] rounded-full"></div>
</div>
<div class="flex justify-between items-center text-sm">
<span>ภาคความสามารถ</span>
<span class="font-bold">60 คะแนน</span>
</div>
<div class="w-full h-1.5 bg-white/20 rounded-full">
<div class="h-full bg-white w-[60%] rounded-full"></div>
</div>
</div>
</div>
<!-- Settings Panel -->
<div class="bg-white rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-4">การตั้งค่าชุดประเมิน</h3>
<div class="space-y-4">
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">ระยะเวลาในการทดสอบ (นาที)</label>
<input class="w-full px-4 py-2 rounded-lg border border-outline focus:border-primary focus:ring-0 outline-none" type="number" value="60"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-1">เกณฑ์ผ่านการประเมิน (%)</label>
<input class="w-full px-4 py-2 rounded-lg border border-outline focus:border-primary focus:ring-0 outline-none" type="number" value="70"/>
</div>
<div class="pt-2">
<label class="flex items-center gap-3 cursor-pointer">
<div class="relative inline-block w-10 h-6">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-full h-full bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-all"></div>
<div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-5"></div>
</div>
<span class="font-label-md text-label-md text-on-surface">เปิดใช้งานทันทีหลังจากบันทึก</span>
</label>
</div>
</div>
<button class="w-full mt-4 py-2.5 border border-primary text-primary rounded-lg font-label-md hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-lg">visibility</span>
                                ตัวอย่างหน้าจอผู้เข้าสอบ
                            </button>
</div>
<!-- Info Alert -->
<div class="bg-surface-container-high rounded-xl p-4 flex gap-3 border border-outline-variant">
<span class="material-symbols-outlined text-primary">info</span>
<p class="text-sm text-on-surface-variant">
                                กรุณาตรวจสอบเกณฑ์การให้คะแนนทุกครั้งเพื่อให้แน่ใจว่าคะแนนรวมทั้งหมดถูกต้องตามหลักสูตรที่กำหนดไว้
                            </p>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- Success Modal (Hidden by default) -->
<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm hidden" id="save-modal">
<div class="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center transform scale-95 opacity-0 transition-all duration-300">
<div class="w-20 h-20 bg-primary-container text-white rounded-full flex items-center justify-center mx-auto mb-6">
<span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<h2 class="font-headline-md text-headline-md text-on-surface mb-2">บันทึกข้อมูลสำเร็จ</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-8">ชุดประเมินถูกสร้างและจัดเก็บเข้าสู่ระบบเรียบร้อยแล้ว</p>
<button class="w-full py-3 bg-primary text-white rounded-lg font-label-md hover:opacity-90 transition-all" onclick="toggleModal()">
                รับทราบ
            </button>
</div>
</div>
<script>
        function toggleModal() {
            const modal = document.getElementById('save-modal');
            const content = modal.querySelector('div');
            if (modal.classList.contains('hidden')) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }, 10);
            } else {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
            }
        }

        // Add visual click effect for buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mousedown', () => {
                btn.style.transform = 'scale(0.98)';
            });
            btn.addEventListener('mouseup', () => {
                btn.style.transform = 'scale(1)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
        });
    </script>
</body></html>

<!-- สร้างชุดประเมินและข้อสอบ - TMRDA -->
<!DOCTYPE html>

<html lang="th"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>TMRDA - จัดการคอร์สเรียน</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-surface": "#0b1c30",
                    "inverse-on-surface": "#eaf1ff",
                    "on-background": "#0b1c30",
                    "on-primary-fixed": "#410002",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed": "#191c1e",
                    "on-primary-fixed-variant": "#93000b",
                    "inverse-surface": "#213145",
                    "on-surface-variant": "#5c403c",
                    "error-container": "#ffdad6",
                    "background": "#f8f9ff",
                    "surface-container-lowest": "#ffffff",
                    "surface-container-low": "#eff4ff",
                    "secondary-fixed": "#d8e3fb",
                    "surface-tint": "#bf0715",
                    "on-secondary-fixed-variant": "#3c475a",
                    "on-tertiary": "#ffffff",
                    "secondary-fixed-dim": "#bcc7de",
                    "surface-variant": "#d3e4fe",
                    "tertiary-container": "#6f7274",
                    "tertiary-fixed-dim": "#c4c7c9",
                    "surface-container-highest": "#d3e4fe",
                    "primary": "#b70011",
                    "outline-variant": "#e6bdb8",
                    "tertiary-fixed": "#e0e3e5",
                    "surface-dim": "#cbdbf5",
                    "primary-container": "#dc2626",
                    "surface-container": "#e5eeff",
                    "on-primary-container": "#fff6f5",
                    "on-secondary": "#ffffff",
                    "surface-bright": "#f8f9ff",
                    "tertiary": "#565a5b",
                    "secondary": "#545f73",
                    "inverse-primary": "#ffb4ab",
                    "on-tertiary-container": "#f6f8fa",
                    "surface-container-high": "#dce9ff",
                    "on-error": "#ffffff",
                    "secondary-container": "#d5e0f8",
                    "on-secondary-container": "#586377",
                    "primary-fixed": "#ffdad6",
                    "surface": "#f8f9ff",
                    "primary-fixed-dim": "#ffb4ab",
                    "on-primary": "#ffffff",
                    "outline": "#916f6b",
                    "on-error-container": "#93000a",
                    "on-tertiary-fixed-variant": "#444749",
                    "on-secondary-fixed": "#111c2d"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "section-gap": "2.5rem",
                    "stack-sm": "0.5rem",
                    "stack-md": "1rem",
                    "margin-mobile": "1rem",
                    "gutter": "1.5rem",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "headline-sm": ["IBM Plex Sans Thai"],
                    "display-lg": ["IBM Plex Sans Thai"],
                    "headline-md": ["IBM Plex Sans Thai"],
                    "body-lg": ["IBM Plex Sans Thai"],
                    "label-sm": ["IBM Plex Sans Thai"],
                    "body-md": ["IBM Plex Sans Thai"],
                    "label-md": ["IBM Plex Sans Thai"]
            },
            "fontSize": {
                    "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "display-lg": ["36px", {"lineHeight": "44px", "fontWeight": "700"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "500"}]
            }
          },
        },
      }
    </script>
<style>
        body { font-family: 'IBM Plex Sans Thai', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="bg-background text-on-surface overflow-x-hidden">
<!-- TopAppBar -->
<header class="flex justify-between items-center px-gutter h-16 w-full fixed top-0 z-50 bg-surface border-b border-outline-variant">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-primary cursor-pointer lg:hidden">menu</span>
<div class="text-headline-md font-headline-md font-bold text-primary">TMRDA</div>
</div>
<div class="flex items-center gap-stack-md">
<div class="relative hidden md:flex items-center bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant">
<span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
<input class="bg-transparent border-none focus:ring-0 text-label-md placeholder-on-surface-variant" placeholder="ค้นหาคอร์สหรือข้อมูล..." type="text"/>
</div>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
<span class="material-symbols-outlined">settings</span>
</button>
<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold ml-2">
                A
            </div>
</div>
</header>
<div class="flex pt-16 min-h-screen">
<!-- SideNavBar -->
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col py-4 px-3 overflow-y-auto bg-surface-container-low border-r border-outline-variant hidden md:flex">
<div class="mb-8 px-2">
<div class="text-headline-sm font-headline-sm font-bold text-primary">TMRDA Admin</div>
<div class="text-label-sm text-on-surface-variant opacity-70">ระบบบริหารจัดการการฝึกอบรม</div>
</div>
<nav class="flex-1 space-y-1">
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">home</span> หน้าแรก
                </a>
<a class="flex items-center gap-3 px-3 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold font-label-md text-label-md translate-x-1 duration-150" href="#">
<span class="material-symbols-outlined">menu_book</span> การจัดการคอร์ส
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">group</span> สมาชิก
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">edit_note</span> การประเมิน
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">assignment_turned_in</span> ผลการทดสอบ
                </a>
</nav>
<div class="mt-auto space-y-1 border-t border-outline-variant pt-4">
<button class="w-full flex items-center gap-3 px-3 py-3 text-primary bg-white border border-primary rounded-lg font-bold hover:bg-primary hover:text-white transition-all mb-4">
<span class="material-symbols-outlined">add_circle</span> สร้างคอร์สใหม่
                </button>
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">settings</span> ตั้งค่า
                </a>
<a class="flex items-center gap-3 px-3 py-3 text-error hover:bg-error-container transition-all rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">logout</span> ออกจากระบบ
                </a>
</div>
</aside>
<!-- Main Content Area -->
<main class="flex-1 md:ml-64 p-gutter max-w-full">
<div class="max-w-[1440px] mx-auto">
<!-- Page Header -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
<div>
<h1 class="font-display-lg text-display-lg text-on-surface">การจัดการคอร์สเรียน</h1>
<p class="font-body-md text-body-md text-on-surface-variant mt-1">หน้าหลัก / จัดการคอร์ส</p>
</div>
<div class="flex gap-stack-md">
<button class="bg-primary-container text-on-primary-container px-6 py-2.5 rounded font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm">
<span class="material-symbols-outlined text-[20px]">add</span> เพิ่มคอร์สใหม่
                        </button>
</div>
</div>
<!-- Dashboard Stats Grid (Bento Style) -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-8">
<div class="bg-white border border-outline-variant p-6 rounded-lg">
<div class="flex justify-between items-start">
<div>
<p class="text-label-sm text-on-surface-variant uppercase tracking-wider">คอร์สทั้งหมด</p>
<h2 class="text-display-lg font-display-lg mt-2">12</h2>
</div>
<div class="bg-primary-fixed p-2 rounded-lg text-primary">
<span class="material-symbols-outlined">library_books</span>
</div>
</div>
<p class="text-emerald-600 text-label-md font-bold mt-4 flex items-center">
<span class="material-symbols-outlined text-sm mr-1">trending_up</span> +2 เดือนนี้
                        </p>
</div>
<div class="bg-white border border-outline-variant p-6 rounded-lg">
<div class="flex justify-between items-start">
<div>
<p class="text-label-sm text-on-surface-variant uppercase tracking-wider">กำลังเปิดสอน</p>
<h2 class="text-display-lg font-display-lg mt-2">8</h2>
</div>
<div class="bg-surface-variant p-2 rounded-lg text-secondary">
<span class="material-symbols-outlined">play_circle</span>
</div>
</div>
<p class="text-on-surface-variant text-label-md mt-4">อัปเดตล่าสุด 2 ชม. ที่แล้ว</p>
</div>
<div class="bg-white border border-outline-variant p-6 rounded-lg">
<div class="flex justify-between items-start">
<div>
<p class="text-label-sm text-on-surface-variant uppercase tracking-wider">ผู้สมัครเรียน</p>
<h2 class="text-display-lg font-display-lg mt-2">342</h2>
</div>
<div class="bg-tertiary-fixed p-2 rounded-lg text-tertiary">
<span class="material-symbols-outlined">person_add</span>
</div>
</div>
<p class="text-emerald-600 text-label-md font-bold mt-4 flex items-center">
<span class="material-symbols-outlined text-sm mr-1">trending_up</span> +15% จากสัปดาห์ก่อน
                        </p>
</div>
<div class="bg-white border border-outline-variant p-6 rounded-lg">
<div class="flex justify-between items-start">
<div>
<p class="text-label-sm text-on-surface-variant uppercase tracking-wider">รออนุมัติ</p>
<h2 class="text-display-lg font-display-lg mt-2">15</h2>
</div>
<div class="bg-error-container p-2 rounded-lg text-error">
<span class="material-symbols-outlined">pending_actions</span>
</div>
</div>
<p class="text-error text-label-md font-bold mt-4">ต้องดำเนินการเร่งด่วน</p>
</div>
</div>
<!-- Search & Filters Container -->
<div class="bg-white border border-outline-variant p-4 mb-4 rounded-t-lg flex flex-col md:flex-row justify-between items-center gap-4">
<div class="flex items-center gap-4 w-full md:w-auto">
<div class="flex items-center gap-2">
<span class="text-label-md">Show</span>
<select class="border-outline-variant rounded px-2 py-1 focus:ring-primary text-label-md">
<option>10</option>
<option>25</option>
<option>50</option>
</select>
<span class="text-label-md">entries</span>
</div>
</div>
<div class="flex items-center gap-2 w-full md:w-auto">
<span class="text-label-md font-bold">Search:</span>
<input class="border border-outline-variant rounded px-3 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary w-full md:w-64" placeholder="พิมพ์ชื่อคอร์ส..." type="text"/>
</div>
</div>
<!-- Course Table -->
<div class="bg-white border border-outline-variant rounded-b-lg overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant">
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant">#</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant cursor-pointer hover:text-primary">
<div class="flex items-center gap-1">ชื่อคอร์ส <span class="material-symbols-outlined text-[16px]">unfold_more</span></div>
</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant">สถานที่</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant">จำนวนชั่วโมง</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant">แผนก</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant">ระหว่างวันที่</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant text-right">คำสั่ง</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant">
<!-- Row 1 -->
<tr class="hover:bg-background transition-colors group">
<td class="px-6 py-4 text-body-md">1</td>
<td class="px-6 py-4">
<div class="font-bold text-on-surface">การวิเคราะห์ข้อมูลด้วย Python</div>
<div class="text-label-sm text-on-surface-variant">ระดับขั้นสูง (Advanced)</div>
</td>
<td class="px-6 py-4 text-body-md text-on-surface-variant">สถาบันพัฒนาฝีมือแรงงาน</td>
<td class="px-6 py-4 text-body-md">40 ชม.</td>
<td class="px-6 py-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm bg-surface-variant text-on-secondary-container">เทคโนโลยีสารสนเทศ</span>
</td>
<td class="px-6 py-4 text-body-md text-on-surface-variant">01/09/2026 - 07/09/2026</td>
<td class="px-6 py-4 text-right">
<div class="flex justify-end gap-2">
<button class="px-4 py-1.5 bg-primary text-white rounded text-label-md font-bold flex items-center gap-1 hover:bg-opacity-90 transition-all" onclick="openModal()">
                                                แก้ไข <span class="material-symbols-outlined text-[16px]">edit_square</span>
</button>
</div>
</td>
</tr>
<!-- Row 2 -->
<tr class="hover:bg-background transition-colors group">
<td class="px-6 py-4 text-body-md">2</td>
<td class="px-6 py-4">
<div class="font-bold text-on-surface">การเขียนโปรแกรมเว็บเบื้องต้น</div>
<div class="text-label-sm text-on-surface-variant">ระดับพื้นฐาน (Beginner)</div>
</td>
<td class="px-6 py-4 text-body-md text-on-surface-variant">สถาบันพัฒนาฝีมือแรงงาน</td>
<td class="px-6 py-4 text-body-md">30 ชม.</td>
<td class="px-6 py-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm bg-surface-variant text-on-secondary-container">เทคโนโลยีสารสนเทศ</span>
</td>
<td class="px-6 py-4 text-body-md text-on-surface-variant">10/08/2026 - 15/08/2026</td>
<td class="px-6 py-4 text-right">
<div class="flex justify-end gap-2">
<button class="px-4 py-1.5 bg-primary text-white rounded text-label-md font-bold flex items-center gap-1 hover:bg-opacity-90 transition-all" onclick="openModal()">
                                                แก้ไข <span class="material-symbols-outlined text-[16px]">edit_square</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
<!-- Pagination -->
<div class="bg-surface-container-low px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
<p class="text-label-md text-on-surface-variant">Showing 1 to 2 of 2 entries</p>
<div class="flex items-center border border-outline-variant rounded overflow-hidden">
<button class="px-4 py-2 bg-white text-on-surface-variant border-r border-outline-variant hover:bg-background disabled:opacity-50" disabled="">Previous</button>
<button class="px-4 py-2 bg-primary text-white font-bold">1</button>
<button class="px-4 py-2 bg-white text-on-surface-variant border-l border-outline-variant hover:bg-background disabled:opacity-50" disabled="">Next</button>
</div>
</div>
</div>
<!-- Quick Actions / Visual Placeholder -->
<div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-gutter">
<div class="relative rounded-lg overflow-hidden h-64 shadow-lg group">
<div class="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" data-alt="A clean, minimalist high-tech server room background with soft red lighting and blurred server racks. The image conveys high security, precision data management, and professional digital infrastructure. The composition follows a symmetrical perspective with cool grey tones and vibrant red accents on status indicators." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDCBhpOnq7zA-8EZyO_bzzWgJgveByhsYcwVIyX5t04t3IeaF2rkqi9MRBdACh56zBMFdjCXhRDETCrTQh5o0u1zllj-Io_tqQILr_FuOhrMvIMH0ZFqBPnW_q70TDpNVOdWIxdhleL7h4p4wg2Ug2lJ9MPn24HndCwP9kLyckXmv29-MvQ9-UU663SZkBa8SYdTDjBzU_yPJPkzIESqfXBUVLgRpGvHjxJnHuLCEADkEBtme0Zjlbd')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent flex flex-col justify-end p-8 text-white">
<h3 class="text-headline-sm font-headline-sm mb-2">โครงสร้างพื้นฐานดิจิทัล</h3>
<p class="text-body-md opacity-90 max-w-md">ระบบประมวลผลข้อมูลการอบรมแบบ Real-time เพื่อประสิทธิภาพสูงสุดในการบริหารจัดการทรัพยากรมนุษย์</p>
</div>
</div>
<div class="bg-white border border-outline-variant p-8 rounded-lg flex flex-col justify-center">
<div class="flex items-center gap-4 mb-4">
<div class="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-white">
<span class="material-symbols-outlined">insights</span>
</div>
<h3 class="text-headline-sm font-headline-sm">สถิติการอบรมรายเดือน</h3>
</div>
<p class="text-body-md text-on-surface-variant mb-6">วิเคราะห์แนวโน้มการสมัครเรียนและอัตราการสำเร็จการศึกษาในแต่ละแผนก เพื่อวางแผนพัฒนาหลักสูตรในอนาคต</p>
<div class="space-y-4">
<div class="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: 75%"></div>
</div>
<div class="flex justify-between text-label-sm text-on-surface-variant">
<span>เป้าหมายรายเดือน (750 คน)</span>
<span class="font-bold text-primary">563/750</span>
</div>
</div>
</div>
</div>
</div>
</main>
</div>
<!-- Modal: Edit Course (Hidden by default) -->
<div class="fixed inset-0 z-[100] hidden" id="editModal">
<div class="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onclick="closeModal()"></div>
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
<div class="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-white z-10">
<h3 class="text-headline-md font-headline-md text-on-surface">แก้ไขข้อมูลคอร์สเรียน</h3>
<button class="text-on-surface-variant hover:text-error transition-colors" onclick="closeModal()">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<div class="p-8">
<!-- Modal Tabs -->
<div class="flex flex-wrap gap-2 mb-8 justify-center">
<button class="px-4 py-2 bg-blue-600 text-white rounded text-label-sm font-bold uppercase">สร้างชุดข้อสอบ</button>
<button class="px-4 py-2 bg-amber-500 text-white rounded text-label-sm font-bold uppercase">แก้ไขชุดข้อสอบ</button>
<button class="px-4 py-2 bg-slate-600 text-white rounded text-label-sm font-bold uppercase">สร้างชุดประเมิน</button>
<button class="px-4 py-2 bg-amber-500 text-white rounded text-label-sm font-bold uppercase">แก้ไขชุดประเมิน</button>
<button class="px-4 py-2 bg-emerald-700 text-white rounded text-label-sm font-bold uppercase">รายงานผล</button>
</div>
<div class="text-center mb-8">
<h4 class="text-headline-sm font-headline-sm text-primary">แก้ไขข้อมูลคอร์สเรียน</h4>
</div>
<!-- Form Layout -->
<form class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-1.5">
<label class="text-label-md font-bold">ID (แก้ไขไม่ได้)</label>
<input class="w-full bg-surface-container-low border-outline-variant rounded p-2.5 focus:ring-0 cursor-not-allowed" readonly="" type="text" value="001"/>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">ชื่อหน่วยงาน</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="text" value="สถาบันพัฒนาฝีมือแรงงาน"/>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">สาขา</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="text" value="กรุงเทพมหานคร"/>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">ชื่อหลักสูตร (ภาษาไทย)</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="text" value="การวิเคราะห์ข้อมูลด้วย Python"/>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">ชื่อหลักสูตร (ภาษาอังกฤษ)</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="text" value="Data Analysis with Python"/>
</div>
<div class="grid grid-cols-3 gap-4 col-span-1 md:col-span-2">
<div class="space-y-1.5">
<label class="text-label-md font-bold">ระยะเวลาอบรม (ชม.)</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="number" value="40"/>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">ระดับหลักสูตร</label>
<select class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary">
<option>พื้นฐาน</option>
<option selected="">ขั้นสูง</option>
</select>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">จำนวนผู้เข้าอบรม (สูงสุด)</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="number" value="30"/>
</div>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">วันที่เริ่มอบรม</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="date" value="2026-09-01"/>
</div>
<div class="space-y-1.5">
<label class="text-label-md font-bold">วันที่สิ้นสุด</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" type="date" value="2026-09-07"/>
</div>
<div class="space-y-1.5 col-span-1 md:col-span-2">
<label class="text-label-md font-bold">ผู้บริหารหลักสูตร</label>
<input class="w-full border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary" placeholder="ระบุชื่อผู้ดูแล..." type="text"/>
</div>
<div class="grid grid-cols-2 gap-4 col-span-1 md:col-span-2 pt-4">
<button class="px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded hover:bg-surface-variant transition-colors" onclick="closeModal()" type="button">
                            ปิดหน้าต่าง
                        </button>
<button class="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:opacity-90 transition-all flex items-center justify-center gap-2" type="submit">
<span class="material-symbols-outlined">save</span> บันทึกการแก้ไข
                        </button>
</div>
</form>
<div class="mt-12 border-t border-outline-variant pt-8">
<h5 class="text-headline-sm font-headline-sm text-center mb-6">สมาชิกคอร์สเรียนทั้งหมด</h5>
<div class="bg-surface-container-low p-12 text-center rounded-lg border-2 border-dashed border-outline-variant">
<span class="material-symbols-outlined text-display-lg text-on-surface-variant/30 mb-4">group_off</span>
<p class="text-on-surface-variant">ไม่มีข้อมูลสมาชิกในขณะนี้</p>
</div>
</div>
</div>
</div>
</div>
<!-- Footer Information -->
<footer class="bg-surface-container-low border-t border-outline-variant py-8 mt-12">
<div class="max-w-[1440px] mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant text-label-md">
<p>© Copyright TMRDA. All Rights Reserved</p>
<div class="flex gap-6">
<a class="hover:text-primary transition-colors" href="#">นโยบายความเป็นส่วนตัว</a>
<a class="hover:text-primary transition-colors" href="#">เงื่อนไขการใช้งาน</a>
<a class="hover:text-primary transition-colors" href="#">ติดต่อสอบถาม</a>
</div>
<p>Designed by <span class="text-primary font-bold">TMRDA IT Team</span></p>
</div>
</footer>
<script>
        function openModal() {
            document.getElementById('editModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('editModal').classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    </script>
</body></html>

<!-- จัดการคอร์สเรียน - TMRDA -->
<!DOCTYPE html>

<html lang="th"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>TMRDA - ระบบอนุมัติผลและรายงาน</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-surface": "#0b1c30",
                        "inverse-on-surface": "#eaf1ff",
                        "on-background": "#0b1c30",
                        "on-primary-fixed": "#410002",
                        "error": "#ba1a1a",
                        "on-tertiary-fixed": "#191c1e",
                        "on-primary-fixed-variant": "#93000b",
                        "inverse-surface": "#213145",
                        "on-surface-variant": "#5c403c",
                        "error-container": "#ffdad6",
                        "background": "#f8f9ff",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-low": "#eff4ff",
                        "secondary-fixed": "#d8e3fb",
                        "surface-tint": "#bf0715",
                        "on-secondary-fixed-variant": "#3c475a",
                        "on-tertiary": "#ffffff",
                        "secondary-fixed-dim": "#bcc7de",
                        "surface-variant": "#d3e4fe",
                        "tertiary-container": "#6f7274",
                        "tertiary-fixed-dim": "#c4c7c9",
                        "surface-container-highest": "#d3e4fe",
                        "primary": "#b70011",
                        "outline-variant": "#e6bdb8",
                        "tertiary-fixed": "#e0e3e5",
                        "surface-dim": "#cbdbf5",
                        "primary-container": "#dc2626",
                        "surface-container": "#e5eeff",
                        "on-primary-container": "#fff6f5",
                        "on-secondary": "#ffffff",
                        "surface-bright": "#f8f9ff",
                        "tertiary": "#565a5b",
                        "secondary": "#545f73",
                        "inverse-primary": "#ffb4ab",
                        "on-tertiary-container": "#f6f8fa",
                        "surface-container-high": "#dce9ff",
                        "on-error": "#ffffff",
                        "secondary-container": "#d5e0f8",
                        "on-secondary-container": "#586377",
                        "primary-fixed": "#ffdad6",
                        "surface": "#f8f9ff",
                        "primary-fixed-dim": "#ffb4ab",
                        "on-primary": "#ffffff",
                        "outline": "#916f6b",
                        "on-error-container": "#93000a",
                        "on-tertiary-fixed-variant": "#444749",
                        "on-secondary-fixed": "#111c2d"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "spacing": {
                        "section-gap": "2.5rem",
                        "stack-sm": "0.5rem",
                        "stack-md": "1rem",
                        "margin-mobile": "1rem",
                        "gutter": "1.5rem",
                        "container-max": "1280px"
                    },
                    "fontFamily": {
                        "headline-sm": ["IBM Plex Sans Thai"],
                        "display-lg": ["IBM Plex Sans Thai"],
                        "headline-md": ["IBM Plex Sans Thai"],
                        "body-lg": ["IBM Plex Sans Thai"],
                        "label-sm": ["IBM Plex Sans Thai"],
                        "body-md": ["IBM Plex Sans Thai"],
                        "label-md": ["IBM Plex Sans Thai"]
                    },
                    "fontSize": {
                        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                        "display-lg": ["36px", {"lineHeight": "44px", "fontWeight": "700"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                        "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "500"}]
                    }
                },
            },
        }
    </script>
<style>
        body {
            font-family: 'IBM Plex Sans Thai', sans-serif;
            background-color: #f8f9ff;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .status-pill {
            @apply px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1;
        }
        .status-pass {
            background-color: #d1fae5;
            color: #065f46;
        }
        .status-fail {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        /* Custom scrollbar for institutional feel */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    </style>
</head>
<body class="bg-background text-on-background">
<!-- TopAppBar -->
<header class="flex justify-between items-center px-gutter h-16 w-full fixed top-0 z-50 bg-surface dark:bg-on-surface border-b border-outline-variant dark:border-outline">
<div class="flex items-center gap-4">
<span class="text-headline-md font-headline-md font-bold text-primary dark:text-primary-fixed">TMRDA</span>
<div class="hidden md:flex gap-6 ml-8">
<a class="text-primary dark:text-primary-fixed font-bold border-b-2 border-primary font-label-md text-label-md py-5" href="#">ระบบรายงานผล</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low transition-colors font-label-md text-label-md py-5 px-2" href="#">คู่มือการใช้งาน</a>
</div>
</div>
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all">notifications</button>
<button class="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all">settings</button>
<div class="flex items-center gap-3 pl-4 border-l border-outline-variant">
<div class="text-right hidden sm:block">
<p class="font-label-md text-label-md text-on-surface font-bold">สมชาย ผู้ดูแลระบบ</p>
<p class="text-[10px] text-on-surface-variant leading-none">ADMINISTRATOR</p>
</div>
<div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold overflow-hidden">
<img class="w-full h-full object-cover" data-alt="A professional close-up studio portrait of a Thai male administrator in a clean white business shirt, smiling confidently. The background is a blurred corporate office setting with soft, high-key lighting that emphasizes a modern, light-mode UI aesthetic. The overall mood is authoritative yet approachable." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3SxLvP5PSbbOlmOPED77PMDUtrs0U1vPDi_2HPFYh8DDiHnHtDTCTJ9hYVKgbNMznJ3g63tIDYEWcKPgYJAYgpUqyfU1JxLfAotHqRSl7BkHFrBkO3tprLZn_CTlgZOf7vNTbQafoynaCk7kpW7nCJ8BmkQvQzl1FqPePH9cRTi3UJgSjDyxGHBUAV3Kjd8HJOtpGoboQwgZL4igUv5Jn4C3zTRi2arm-YeHldLbxjiY-V_3XKzbX"/>
</div>
</div>
</div>
</header>
<!-- SideNavBar -->
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col py-4 px-3 overflow-y-auto bg-surface-container-low dark:bg-inverse-surface border-r border-outline-variant dark:border-outline hidden md:flex">
<div class="mb-8 px-2">
<h2 class="text-headline-sm font-headline-sm font-bold text-primary dark:text-primary-fixed">TMRDA Admin</h2>
<p class="font-body-md text-body-md text-on-surface-variant opacity-70">ระบบบริหารจัดการการฝึกอบรม</p>
</div>
<nav class="flex-grow space-y-1">
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high rounded-lg transition-all font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined">home</span>
                หน้าแรก
            </a>
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high rounded-lg transition-all font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">menu_book</span>
                การจัดการคอร์ส
            </a>
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high rounded-lg transition-all font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">group</span>
                สมาชิก
            </a>
<a class="flex items-center gap-3 px-3 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high rounded-lg transition-all font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">edit_note</span>
                การประเมิน
            </a>
<a class="flex items-center gap-3 px-3 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold transition-all translate-x-1 duration-150 font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">assignment_turned_in</span>
                ผลการทดสอบ
            </a>
</nav>
<div class="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-1">
<button class="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-md">
<span class="material-symbols-outlined">add_circle</span>
                สร้างคอร์สใหม่
            </button>
<a class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">settings</span>
                ตั้งค่า
            </a>
<a class="flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container rounded-lg font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">logout</span>
                ออกจากระบบ
            </a>
</div>
</aside>
<!-- Main Content -->
<main class="md:ml-64 pt-20 p-gutter transition-all">
<div class="max-w-container-max mx-auto">
<!-- Header Section -->
<div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
<div>
<h1 class="font-display-lg text-display-lg text-on-surface mb-1">หน้าอนุมัติผลและรายงาน</h1>
<nav class="flex text-label-sm font-label-sm text-on-surface-variant gap-2 items-center">
<a class="hover:text-primary transition-colors" href="#">หน้าแรก</a>
<span class="material-symbols-outlined text-[14px]">chevron_right</span>
<a class="hover:text-primary transition-colors" href="#">ผลการทดสอบ</a>
<span class="material-symbols-outlined text-[14px]">chevron_right</span>
<span class="text-primary font-bold">อนุมัติผลการทดสอบ</span>
</nav>
</div>
<div class="flex gap-2">
<button class="flex items-center gap-2 px-4 py-2 bg-surface border border-outline rounded hover:bg-surface-container-low transition-all text-on-surface font-label-md text-label-md">
<span class="material-symbols-outlined text-[20px]">download</span>
                        ส่งออกไฟล์ (CSV/PDF)
                    </button>
<button class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-container transition-all font-label-md text-label-md shadow-sm">
<span class="material-symbols-outlined text-[20px]">done_all</span>
                        อนุมัติทั้งหมดที่เลือก
                    </button>
</div>
</div>
<!-- Stats Overview (Institutional Style) -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-8">
<div class="bg-white border border-outline-variant p-5 rounded-lg">
<p class="text-label-sm font-label-sm text-on-surface-variant uppercase">ผู้เข้าสอบทั้งหมด</p>
<div class="flex items-end justify-between mt-2">
<h3 class="text-headline-md font-headline-md text-on-surface">1,248</h3>
<span class="text-primary text-label-sm">+12% เดือนนี้</span>
</div>
</div>
<div class="bg-white border border-outline-variant p-5 rounded-lg">
<p class="text-label-sm font-label-sm text-on-surface-variant uppercase">ผ่านการทดสอบ</p>
<div class="flex items-end justify-between mt-2">
<h3 class="text-headline-md font-headline-md text-on-surface">1,056</h3>
<span class="text-emerald-600 font-bold text-label-sm">84.6%</span>
</div>
</div>
<div class="bg-white border border-outline-variant p-5 rounded-lg">
<p class="text-label-sm font-label-sm text-on-surface-variant uppercase">ไม่ผ่านการทดสอบ</p>
<div class="flex items-end justify-between mt-2">
<h3 class="text-headline-md font-headline-md text-on-surface">192</h3>
<span class="text-error font-bold text-label-sm">15.4%</span>
</div>
</div>
<div class="bg-white border border-outline-variant p-5 rounded-lg">
<p class="text-label-sm font-label-sm text-on-surface-variant uppercase">รอการอนุมัติ</p>
<div class="flex items-end justify-between mt-2">
<h3 class="text-headline-md font-headline-md text-primary">45</h3>
<span class="text-on-surface-variant opacity-50 text-label-sm">ต้องจัดการทันที</span>
</div>
</div>
</div>
<!-- Filters & Search -->
<div class="bg-white border border-outline-variant rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4">
<div class="flex-grow min-w-[280px]">
<div class="relative">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="w-full pl-10 pr-4 py-2 border border-outline-variant rounded focus:ring-1 focus:ring-primary focus:border-primary bg-background/50" placeholder="ค้นหารายชื่อ, เลขบัตรประชาชน หรือ คอร์ส..." type="text"/>
</div>
</div>
<div class="flex gap-2">
<select class="border border-outline-variant rounded px-3 py-2 bg-white text-label-md">
<option>คอร์สทั้งหมด</option>
<option>การวิเคราะห์ข้อมูลด้วย Python</option>
<option>เทคโนโลยีสารสนเทศเบื้องต้น</option>
</select>
<select class="border border-outline-variant rounded px-3 py-2 bg-white text-label-md">
<option>สถานะทั้งหมด</option>
<option>ผ่านการทดสอบ</option>
<option>ไม่ผ่านการทดสอบ</option>
<option>รออนุมัติ</option>
</select>
</div>
</div>
<!-- Report Table Container -->
<div class="bg-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant">
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase sticky left-0 bg-surface-container-low z-10 w-12 text-center">
<input class="rounded text-primary focus:ring-primary" type="checkbox"/>
</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase w-16 text-center">ลำดับ</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase min-w-[200px]">ผู้เข้ารับการทดสอบ</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase">บัตรประชาชน</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase text-center bg-surface-container/50">ภาคความรู้</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase text-center bg-surface-container/50">ภาคความสามารถ</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase text-center bg-primary-container/10">คะแนนรวม</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase text-center">ผลการทดสอบ</th>
<th class="p-4 text-label-sm font-label-sm text-on-surface-variant uppercase text-center sticky right-0 bg-surface-container-low z-10">การจัดการ</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/50">
<!-- Row 1: Pass -->
<tr class="hover:bg-surface-container-lowest transition-colors group">
<td class="p-4 text-center sticky left-0 bg-white group-hover:bg-surface-container-lowest">
<input class="rounded text-primary focus:ring-primary" type="checkbox"/>
</td>
<td class="p-4 text-center font-label-md text-label-md text-on-surface-variant">1</td>
<td class="p-4">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary text-xs font-bold">ธพ</div>
<div>
<p class="font-label-md text-label-md text-on-surface font-bold leading-tight">ธนพนธ์ สุวรรณฉาย</p>
<p class="text-[11px] text-on-surface-variant">คอร์ส: การวิเคราะห์ข้อมูลเบื้องต้น</p>
</div>
</div>
</td>
<td class="p-4 font-label-md text-label-md text-on-surface-variant tabular-nums">1-1002-XXXXX-XX-X</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">45 <span class="text-[10px] font-normal text-on-surface-variant">/ 50</span></p>
</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">48 <span class="text-[10px] font-normal text-on-surface-variant">/ 50</span></p>
</td>
<td class="p-4 text-center bg-primary-container/5">
<p class="text-headline-sm font-headline-sm text-primary">93</p>
</td>
<td class="p-4 text-center">
<span class="status-pill status-pass">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
                                        ผ่าน
                                    </span>
</td>
<td class="p-4 text-center sticky right-0 bg-white group-hover:bg-surface-container-lowest">
<div class="flex items-center justify-center gap-2">
<button class="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="ดูรายละเอียด"><span class="material-symbols-outlined">visibility</span></button>
<button class="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="แก้ไข"><span class="material-symbols-outlined">edit</span></button>
</div>
</td>
</tr>
<!-- Row 2: Fail -->
<tr class="hover:bg-surface-container-lowest transition-colors group">
<td class="p-4 text-center sticky left-0 bg-white group-hover:bg-surface-container-lowest">
<input class="rounded text-primary focus:ring-primary" type="checkbox"/>
</td>
<td class="p-4 text-center font-label-md text-label-md text-on-surface-variant">2</td>
<td class="p-4">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary text-xs font-bold">วส</div>
<div>
<p class="font-label-md text-label-md text-on-surface font-bold leading-tight">วิศรุต สุขถาวร</p>
<p class="text-[11px] text-on-surface-variant">คอร์ส: การวิเคราะห์ข้อมูลเบื้องต้น</p>
</div>
</div>
</td>
<td class="p-4 font-label-md text-label-md text-on-surface-variant tabular-nums">3-4099-XXXXX-XX-X</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">22 <span class="text-[10px] font-normal text-error">/ 50</span></p>
</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">30 <span class="text-[10px] font-normal text-on-surface-variant">/ 50</span></p>
</td>
<td class="p-4 text-center bg-primary-container/5">
<p class="text-headline-sm font-headline-sm text-on-surface-variant">52</p>
</td>
<td class="p-4 text-center">
<span class="status-pill status-fail">
<span class="material-symbols-outlined text-[14px]">cancel</span>
                                        ไม่ผ่าน
                                    </span>
</td>
<td class="p-4 text-center sticky right-0 bg-white group-hover:bg-surface-container-lowest">
<div class="flex items-center justify-center gap-2">
<button class="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="ดูรายละเอียด"><span class="material-symbols-outlined">visibility</span></button>
<button class="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="แก้ไข"><span class="material-symbols-outlined">edit</span></button>
</div>
</td>
</tr>
<!-- Row 3: Pending -->
<tr class="hover:bg-surface-container-lowest transition-colors group">
<td class="p-4 text-center sticky left-0 bg-white group-hover:bg-surface-container-lowest">
<input class="rounded text-primary focus:ring-primary" type="checkbox"/>
</td>
<td class="p-4 text-center font-label-md text-label-md text-on-surface-variant">3</td>
<td class="p-4">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary text-xs font-bold">กม</div>
<div>
<p class="font-label-md text-label-md text-on-surface font-bold leading-tight">กมลวรรณ มีสุข</p>
<p class="text-[11px] text-on-surface-variant">คอร์ส: เทคโนโลยีสารสนเทศเบื้องต้น</p>
</div>
</div>
</td>
<td class="p-4 font-label-md text-label-md text-on-surface-variant tabular-nums">1-1209-XXXXX-XX-X</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">42 <span class="text-[10px] font-normal text-on-surface-variant">/ 50</span></p>
</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">45 <span class="text-[10px] font-normal text-on-surface-variant">/ 50</span></p>
</td>
<td class="p-4 text-center bg-primary-container/5">
<p class="text-headline-sm font-headline-sm text-on-surface">87</p>
</td>
<td class="p-4 text-center">
<span class="status-pill status-pending">
<span class="material-symbols-outlined text-[14px]">history</span>
                                        รออนุมัติ
                                    </span>
</td>
<td class="p-4 text-center sticky right-0 bg-white group-hover:bg-surface-container-lowest">
<div class="flex items-center justify-center gap-2">
<button class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="อนุมัติ"><span class="material-symbols-outlined">check</span></button>
<button class="p-1.5 text-error hover:bg-error-container rounded transition-colors" title="ปฏิเสธ"><span class="material-symbols-outlined">close</span></button>
<button class="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="แก้ไข"><span class="material-symbols-outlined">edit</span></button>
</div>
</td>
</tr>
<!-- More rows for data density -->
<tr class="hover:bg-surface-container-lowest transition-colors group">
<td class="p-4 text-center sticky left-0 bg-white group-hover:bg-surface-container-lowest">
<input class="rounded text-primary focus:ring-primary" type="checkbox"/>
</td>
<td class="p-4 text-center font-label-md text-label-md text-on-surface-variant">4</td>
<td class="p-4">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary text-xs font-bold">ปว</div>
<div>
<p class="font-label-md text-label-md text-on-surface font-bold leading-tight">ปวริศ วงศ์เทวา</p>
<p class="text-[11px] text-on-surface-variant">คอร์ส: ระบบเครือข่ายพื้นฐาน</p>
</div>
</div>
</td>
<td class="p-4 font-label-md text-label-md text-on-surface-variant tabular-nums">1-1502-XXXXX-XX-X</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">38 <span class="text-[10px] font-normal text-on-surface-variant">/ 50</span></p>
</td>
<td class="p-4 text-center bg-surface-container/20">
<p class="font-bold text-on-surface">40 <span class="text-[10px] font-normal text-on-surface-variant">/ 50</span></p>
</td>
<td class="p-4 text-center bg-primary-container/5">
<p class="text-headline-sm font-headline-sm text-on-surface">78</p>
</td>
<td class="p-4 text-center">
<span class="status-pill status-pass">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
                                        ผ่าน
                                    </span>
</td>
<td class="p-4 text-center sticky right-0 bg-white group-hover:bg-surface-container-lowest">
<div class="flex items-center justify-center gap-2">
<button class="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="ดูรายละเอียด"><span class="material-symbols-outlined">visibility</span></button>
<button class="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="แก้ไข"><span class="material-symbols-outlined">edit</span></button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
<!-- Pagination -->
<div class="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
<p class="text-label-sm font-label-sm text-on-surface-variant">แสดง 1 ถึง 4 จากทั้งหมด 1,248 รายการ</p>
<div class="flex gap-1">
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container-low transition-colors"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
<button class="w-8 h-8 flex items-center justify-center rounded bg-primary text-white font-bold text-label-sm">1</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container-low transition-colors text-label-sm">2</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container-low transition-colors text-label-sm">3</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container-low transition-colors text-label-sm">...</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container-low transition-colors text-label-sm">125</button>
<button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container-low transition-colors"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
</div>
</div>
</div>
<!-- Footer Institutional Info -->
<footer class="mt-12 pt-8 border-t border-outline-variant text-on-surface-variant opacity-60 text-center pb-8">
<p class="text-label-sm font-label-sm">© สงวนลิขสิทธิ์ 2567 TMRDA - สถาบันเทคโนโลยีการบริหารจัดการข้อมูลแห่งชาติ</p>
<p class="text-[10px] mt-1">Version 2.4.1 (Stable Build)</p>
</footer>
</div>
</main>
<!-- Success Feedback Overlay (Hidden by default) -->
<div class="fixed bottom-8 right-8 bg-on-surface text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 translate-y-24 opacity-0 transition-all duration-500 z-[100]" id="success-toast">
<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
<span class="material-symbols-outlined text-[20px]">check</span>
</div>
<div>
<p class="font-bold text-label-md">อนุมัติผลเรียบร้อยแล้ว</p>
<p class="text-xs opacity-70">ระบบได้ทำการบันทึกข้อมูลและออกใบประกาศแล้ว</p>
</div>
</div>
<script>
        // Simple Interaction logic
        document.querySelectorAll('button[title="อนุมัติ"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const toast = document.getElementById('success-toast');
                toast.classList.remove('translate-y-24', 'opacity-0');
                
                setTimeout(() => {
                    toast.classList.add('translate-y-24', 'opacity-0');
                }, 3000);
            });
        });

        // Sticky Header color change on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 10) {
                header.classList.add('shadow-md');
            } else {
                header.classList.remove('shadow-md');
            }
        });
    </script>
</body></html>
