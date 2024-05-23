import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CreateSubmissionDto } from '../dtos/CreateSubmissionDto';

export function addSubmission(req: Request, res: Response) {
    const submissionDto = req.body as CreateSubmissionDto;
    console.log(submissionDto);

    return res.status(StatusCodes.CREATED).json({
        success: true,
        error: {},
        message: 'Successfully collected the submission',
        data: submissionDto
    });
}