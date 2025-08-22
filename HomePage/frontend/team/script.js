<!DOCTYPE html>
<html lang="de" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prereact – Unser Team</title>
  <meta name="description" content="Prereact – Smarte Softwarelösungen & engagiertes Team">
  <link rel="icon" href="/assets/logo.png" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0d0d0d] text-white font-sans">

  <!-- Navbar -->
  <nav class="bg-black bg-opacity-80 fixed w-full z-50 shadow-md">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <a href="#" class="text-xl font-bold text-white">Prereact</a>
      <ul class="flex gap-6 text-sm">
        <li><a href="#team" class="hover:text-blue-400">Team</a></li>
        <li><a href="#kontakt" class="hover:text-blue-400">Kontakt</a></li>
        <li><a href="#impressum" class="hover:text-blue-400">Impressum</a></li>
      </ul>
    </div>
  </nav>

  <!-- Hero -->
  <section class="h-screen flex items-center justify-center bg-gradient-to-b from-black to-[#111] text-center px-4">
    <div class="max-w-2xl">
      <h1 class="text-5xl md:text-6xl font-bold mb-4 animate-fadeIn">Digitale Lösungen. Smarte Köpfe.</h1>
      <p class="text-gray-300 text-lg mb-6 animate-fadeIn delay-200">Unser Team gestaltet die Zukunft der Inventur- und Rechnungssysteme.</p>
      <a href="#team" class="inline-block px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">Jetzt kennenlernen</a>
    </div>
  </section>

  <!-- Team Section -->
  <section id="team" class="py-24 bg-[#0d0d0d]">
    <div class="max-w-7xl mx-auto px-6">
      <h2 class="text-4xl font-bold text-center mb-16">Unser Team</h2>
      <div class="grid md:grid-cols-3 gap-12">
        <!-- Rares -->
        <div class="group bg-[#1a1a1a] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition hover:scale-[1.02]">
          <img src="/assets/rares.jpg" alt="Rares" class="w-full h-60 object-cover rounded-xl mb-6 transition duration-700 group-hover:scale-105" />
          <h3 class="text-2xl font-semibold mb-2">Rares Sahleanu</h3>
          <p class="text-gray-400 group-hover:text-gray-300 transition">Visionär & Tech Lead. Baut smarte Systeme mit Leidenschaft für Innovation.</p>
        </div>
        <!-- Eddy -->
        <div class="group bg-[#1a1a1a] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition hover:scale-[1.02]">
          <img src="/assets/eddy.jpg" alt="Eddy" class="w-full h-60 object-cover rounded-xl mb-6 transition duration-700 group-hover:scale-105" />
          <h3 class="text-2xl font-semibold mb-2">Eddy</h3>
          <p class="text-gray-400 group-hover:text-gray-300 transition">Design & UX. Verbindet Ästhetik mit Funktion für intuitive Interfaces.</p>
        </div>
        <!-- Fred -->
        <div class="group bg-[#1a1a1a] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition hover:scale-[1.02]">
          <img src="/assets/fred.jpg" alt="Fred" class="w-full h-60 object-cover rounded-xl mb-6 transition duration-700 group-hover:scale-105" />
          <h3 class="text-2xl font-semibold mb-2">Fred</h3>
          <p class="text-gray-400 group-hover:text-gray-300 transition">Strategie & Kommunikation. Bringt Tech und Markt zusammen.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Kontakt -->
  <section id="kontakt" class="py-24 bg-[#111] text-center">
    <h2 class="text-3xl font-bold mb-6">Kontakt</h2>
    <p class="text-gray-400 mb-4">Schreib uns eine Nachricht oder folge uns auf LinkedIn.</p>
    <a href="mailto:info@prereact.ch" class="text-blue-400 underline">info@prereact.ch</a>
  </section>

  <!-- Impressum -->
  <section id="impressum" class="py-12 bg-[#0d0d0d] text-center text-sm text-gray-500">
    <p>© 2025 Prereact AG – Oberasbach 85, 91710 Gunzenhausen</p>
    <p>Email: info@prereact.ch</p>
  </section>

  <!-- Footer -->
  <footer class="text-center text-gray-500 text-xs py-6 bg-black">&copy; 2025 Prereact</footer>

  <!-- Simple Animations (Tailwind Plugin nötig für delay etc.) -->
  <style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 1s ease-out forwards;
    }
    .delay-200 {
      animation-delay: .2s;
    }
  </style>
</body>
</html>
