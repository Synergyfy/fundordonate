<?php

namespace GrowfundPro\Contracts;

defined( 'ABSPATH' ) || exit;

interface Exportable
{
    /**
     * Export data as an DTO instance.
     *
     * @return \Growfund\DTO\DTO|mixed
     * @throws \Exception
     * */
    public function export();
}
