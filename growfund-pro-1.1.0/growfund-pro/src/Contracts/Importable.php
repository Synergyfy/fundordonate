<?php

namespace GrowfundPro\Contracts;

defined( 'ABSPATH' ) || exit;

interface Importable
{
    /**
     * Import data from an external source.
     * 
     * @return mixed
     * 
     * @throws \Exception
     */
    public function import();
}
