<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>OrganizeLife | O seu centro de controle</title>
    <meta name="description" content="Uma nova forma de organizar sua rotina, finanças e compromissos.">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    {{-- Google Fonts — Plus Jakarta Sans (headings) + Geist (body) --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    {{-- Vite assets (CSS + JS compilados) --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    {{-- React monta aqui --}}
    <div id="app"></div>
</body>
</html>
