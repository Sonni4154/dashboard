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
    
    console.log('Customer webhook triggered:', {
      type: payload.type,
      table: payload.table,
      record_id: payload.record?.id || payload.old_record?.id
    });

    // Process the webhook based on the event type
    switch (payload.type) {
      case 'INSERT':
        console.log('New customer created:', payload.record);
        // Handle new customer creation
        break;
        
      case 'UPDATE':
        console.log('Customer updated:', {
          old: payload.old_record,
          new: payload.record
        });
        // Handle customer updates
        break;
        
      case 'DELETE':
        console.log('Customer deleted:', payload.old_record);
        // Handle customer deletion
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
        message: 'Customer webhook processed successfully',
        event_type: payload.type,
        record_id: payload.record?.id || payload.old_record?.id
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing customer webhook:', error);
    
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
