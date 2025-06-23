@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel')
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="75"
    height="75"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3869d4"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="logo"
    style="display: block; margin: 0 auto;"
    alt="{{ config('app.name') }} Logo"
>
    <path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" />
    <path d="m9 11 3 3L22 4" />
</svg>
@else
{{-- Custom SVG logo matching the login page --}}
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="75"
    height="75"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3869d4"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="logo"
    style="display: block; margin: 0 auto;"
    alt="{{ config('app.name') }} Logo"
>
    <path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344" />
    <path d="m9 11 3 3L22 4" />
</svg>
@endif
</a>
</td>
</tr>
