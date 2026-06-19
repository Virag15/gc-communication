<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Admin Panel Name
    |--------------------------------------------------------------------------
    |
    | The name displayed in the sidebar header and browser title.
    |
    */

    'name' => env('ADMIN_NAME', 'GC Communication'),

    /*
    |--------------------------------------------------------------------------
    | Admin Logo
    |--------------------------------------------------------------------------
    |
    | Path to the logo image displayed in the admin header.
    | Place your logo in public/images/ and update this value.
    |
    */

    'logo' => env('ADMIN_LOGO', ''),

    /*
    |--------------------------------------------------------------------------
    | Timezone
    |--------------------------------------------------------------------------
    |
    | The timezone used for displaying dates in the admin panel.
    | This is passed to the frontend via Inertia shared props.
    |
    */

    'timezone' => env('ADMIN_TIMEZONE', 'Asia/Kolkata'),

];
