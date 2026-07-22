<?php

namespace App\Services\Ai\Exceptions;

use RuntimeException;

/**
 * Thrown when the AI could not turn a natural-language description into a
 * usable task (provider failure or unparseable output). The controller turns
 * this into a friendly 422 so the user can still add the task manually.
 */
class TaskExtractionException extends RuntimeException {}
