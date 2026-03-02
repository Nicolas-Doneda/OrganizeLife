<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>OrganizeLife</title>
    <meta name="description" content="Organize sua vida financeira e pessoal em um só lugar.">

    {{-- Google Fonts — Inter (tipografia moderna e profissional) --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    {{-- Vite assets (CSS + JS compilados) --}}
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    {{-- React monta aqui --}}
    <div id="app"></div>
</body>
</html>
