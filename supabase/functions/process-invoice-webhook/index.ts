import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record?: any;
  old_record?: any;
  schema: string;
}

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    
    console.log('Invoice webhook triggered:', {
      type: payload.type,
      table: payload.table,
      record_id: payload.record?.id || payload.old_record?.id
    });

    // Process the webhook based on the event type
    switch (payload.type) {
      case 'INSERT':
        console.log('New invoice created:', payload.record);
        // Handle new invoice creation
        break;
        
      case 'UPDATE':
        console.log('Invoice updated:', {
          old: payload.old_record,
          new: payload.record
        });
        // Handle invoice updates
        break;
        
      case 'DELETE':
        console.log('Invoice deleted:', payload.old_record);
        // Handle invoice deletion
        break;
    }

    // You can add additional processing here:
    // - Send notifications
    // - Update related records
    // - Trigger external API calls
    // - Log to external services

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invoice webhook processed successfully',
        event_type: payload.type,
        record_id: payload.record?.id || payload.old_record?.id
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing invoice webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
