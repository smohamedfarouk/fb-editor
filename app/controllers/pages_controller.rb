class PagesController < ApplicationController
  default_form_builder GOVUKDesignSystemFormBuilder::FormBuilder

  def create
    @page_creation = PageCreation.new(page_creation_params)

    if @page_creation.create
      redirect_to edit_page_path(service_id, @page_creation.page_url)
    else
      render template: 'services/edit', status: :unprocessable_entity
    end
  end

  def edit
    @page = service.find_page(params[:page_url])
  end

  def update
    @page = service.find_page(params[:page_url])

    @metadata_updater = MetadataUpdater.new(page_update_params)

    if @metadata_updater.update
      redirect_to edit_page_path(service.service_id, params[:page_url])
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def page_creation_params
    params.require(
      :page
    ).permit(
      :page_url, :page_type, :component_type
    ).merge(common_params)
  end

  def page_update_params
    {
      id: @page.id
    }.merge(common_params).merge(params.require(:page).permit!)
  end

  def common_params
    {
      latest_metadata: service_metadata,
      service_id: service_id
    }
  end

  def service_id
    service.service_id
  end

  def reserved_answers_path(*args)
    ''
  end
  helper_method :reserved_answers_path
end
