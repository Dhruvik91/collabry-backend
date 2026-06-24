import { validate } from 'class-validator';
import { SaveProfileDto } from './save-profile.dto';
import { UpdateProfileDto } from './update-profile.dto';

describe('Profile DTO Validation', () => {
    describe('SaveProfileDto', () => {
        it('should pass validation when website is valid URL', async () => {
            const dto = new SaveProfileDto();
            dto.fullName = 'John Doe';
            dto.username = 'johndoe';
            dto.website = 'https://kollabary.com';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when website is empty string', async () => {
            const dto = new SaveProfileDto();
            dto.fullName = 'John Doe';
            dto.username = 'johndoe';
            dto.website = '';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when website is null', async () => {
            const dto = new SaveProfileDto();
            dto.fullName = 'John Doe';
            dto.username = 'johndoe';
            dto.website = null as any;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when website is undefined', async () => {
            const dto = new SaveProfileDto();
            dto.fullName = 'John Doe';
            dto.username = 'johndoe';
            dto.website = undefined;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when website is an invalid URL', async () => {
            const dto = new SaveProfileDto();
            dto.fullName = 'John Doe';
            dto.username = 'johndoe';
            dto.website = 'invalid-url';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUrl');
        });
    });

    describe('UpdateProfileDto', () => {
        it('should pass validation when website is empty string', async () => {
            const dto = new UpdateProfileDto();
            dto.website = '';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when website is an invalid URL', async () => {
            const dto = new UpdateProfileDto();
            dto.website = 'invalid-url';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUrl');
        });
    });
});
