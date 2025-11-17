import type { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { certifications } from '@/lib/types';
import type { Certification } from '@/lib/types';

interface CertificationPickerProps {
  control: Control<any>;
}

export function CertificationPicker({ control }: CertificationPickerProps) {
  return (
    <FormField
      control={control}
      name="certifications"
      render={() => (
        <FormItem>
          <div className="mb-4">
            <FormLabel className="text-base">Certificaciones</FormLabel>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {certifications.map((item) => (
              <FormField
                key={item}
                control={control}
                name="certifications"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={item}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(item)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), item])
                              : field.onChange(
                                  field.value?.filter(
                                    (value: Certification) => value !== item
                                  )
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">{item}</FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
